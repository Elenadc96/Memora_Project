const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { userOwnsLesson } = require('../helpers/ownership');
const {
  flashcardImagesUpload,
  handleUploadError,
  saveImage,
  deleteContentImages,
} = require('../middleware/upload');

// Montato in app.js su /api/lessons con verifyToken a livello di mount.
//
// Le lezioni non hanno un proprio user_id: appartengono a una subject, che a
// sua volta appartiene a un utente (utenti → subject → lessons → flashcard).
// Per questo ogni rotta qui sotto fa sempre un controllo di ownership che
// risale la catena fino a subject.user_id, prima di leggere/scrivere
// qualunque cosa — altrimenti chiunque autenticato potrebbe leggere/
// modificare/cancellare le lezioni e le flashcard di un altro utente
// semplicemente indovinando un id numerico (IDOR). Quando il controllo
// fallisce si risponde 404 "non trovata" invece di 403 "non tua", per non
// confermare a un estraneo che quell'id esiste ma appartiene a qualcun altro.
//
// I campi { error: 'CODICE' } sono codici stabili tradotti dal frontend
// ($t('errors.<codice>')) — vedi il commento in routes/subjects.js.

// PATCH /api/lessons/:id — aggiorna status/last_study/last_lesson_duration dopo una sessione
router.patch('/:id', async (req, res) => {
  try {
    // Risale da lesson a subject per verificare che la lezione sia dell'utente loggato
    if (!(await userOwnsLesson(req.user.id, req.params.id))) {
      return res.status(404).json({ error: 'LESSON_NOT_FOUND' });
    }

    const { status, last_study, last_lesson_duration } = req.body;
    await db.query(
      `UPDATE lessons SET
         status = COALESCE(?, status),
         last_study = COALESCE(?, last_study),
         last_lesson_duration = COALESCE(?, last_lesson_duration)
       WHERE id = ?`,
      [status ?? null, last_study ?? null, last_lesson_duration ?? null, req.params.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('PATCH /api/lessons/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// DELETE /api/lessons/:id — elimina lezione + tutte le sue flashcard + immagini.
//
// Il CASCADE dello schema rimuove automaticamente le righe in flashcard_lesson
// quando si cancella una lesson, ma NON tocca la tabella flashcard stessa
// (le flashcard diventerebbero orfane) né i file immagine sul disco. Per questo:
// 1. Si recuperano le flashcard (id + content) legate a questa lezione
// 2. Si cancellano i file immagine su disco (prima di perdere il riferimento)
// 3. Si cancella la lezione (il CASCADE pulisce flashcard_lesson)
// 4. Si cancellano le righe flashcard ora orfane
router.delete('/:id', async (req, res) => {
  try {
    if (!(await userOwnsLesson(req.user.id, req.params.id))) {
      return res.status(404).json({ error: 'LESSON_NOT_FOUND' });
    }

    // 1. Recupera id + content delle flashcard della lezione
    const [fcRows] = await db.query(
      `SELECT f.id, f.content
       FROM flashcard f
       JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
       WHERE fl.lesson_id = ?`,
      [req.params.id]
    );
    const flashcardIds = fcRows.map(r => r.id);

    // 2. Cancella i file immagine (best-effort: se un file manca già, non blocca)
    await Promise.all(fcRows.map(r => deleteContentImages(r.content)));

    // 3. Elimina la lezione → CASCADE rimuove le righe in flashcard_lesson
    await db.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);

    // 4. Elimina le flashcard ora orfane
    if (flashcardIds.length > 0) {
      await db.query('DELETE FROM flashcard WHERE id IN (?)', [flashcardIds]);
    }

    res.json({ success: true, deletedFlashcards: flashcardIds.length });
  } catch (err) {
    console.error('DELETE /api/lessons/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// GET /api/lessons/:id/flashcards — flashcard di una lezione
// Il campo content (JSON) viene spacchettato in question/answer/immagini per il frontend
router.get('/:id/flashcards', async (req, res) => {
  try {
    if (!(await userOwnsLesson(req.user.id, req.params.id))) {
      return res.status(404).json({ error: 'LESSON_NOT_FOUND' });
    }

    const [rows] = await db.query(`
      SELECT f.id, f.content, f.difficult, f.created_at, fl.status
      FROM flashcard f
      JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
      WHERE fl.lesson_id = ?
      ORDER BY f.created_at ASC
    `, [req.params.id]);
    // mysql2 restituisce le colonne JSON come stringa grezza → va parsata
    const parsed = rows.map(r => {
      const c = typeof r.content === 'string' ? JSON.parse(r.content) : (r.content ?? {});
      return {
        ...r,
        content:       c,
        question:      c.question ?? '',
        answer:        c.answer   ?? '',
        questionImage: c.questionImage ?? null,
        answerImage:   c.answerImage   ?? null,
        status:        r.status ?? 'learning',
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('GET /api/lessons/:id/flashcards:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// POST /api/lessons/:id/flashcards — crea flashcard (con eventuali immagini)
//
// Il body è sempre multipart/form-data (il frontend usa FormData anche quando
// non c'è alcun file): questo evita di avere due formati diversi lato server
// e semplifica il codice del client. multer popola req.body con i campi text
// e req.files con gli eventuali file.
router.post('/:id/flashcards', flashcardImagesUpload, handleUploadError, async (req, res) => {
  const savedPaths = [];
  try {
    if (!(await userOwnsLesson(req.user.id, req.params.id))) {
      return res.status(404).json({ error: 'LESSON_NOT_FOUND' });
    }

    const { question, answer, difficult = 0 } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'FLASHCARD_QUESTION_ANSWER_REQUIRED' });
    }

    // Salva le immagini PRIMA di scrivere sul DB. Se qualcosa fallisce dopo,
    // il catch cancella i file appena creati per non lasciare orfani.
    const questionImagePath = req.files?.questionImage?.[0]
      ? await saveImage(req.files.questionImage[0].buffer)
      : null;
    if (questionImagePath) savedPaths.push(questionImagePath);

    const answerImagePath = req.files?.answerImage?.[0]
      ? await saveImage(req.files.answerImage[0].buffer)
      : null;
    if (answerImagePath) savedPaths.push(answerImagePath);

    const contentObj = {
      question: question.trim(),
      answer:   answer.trim(),
      ...(questionImagePath && { questionImage: questionImagePath }),
      ...(answerImagePath   && { answerImage:   answerImagePath   }),
    };
    const content = JSON.stringify(contentObj);

    const [fcResult] = await db.query(
      'INSERT INTO flashcard (content, difficult) VALUES (?, ?)',
      [content, Number(difficult) || 0]
    );
    await db.query(
      'INSERT INTO flashcard_lesson (flashcard_id, lesson_id) VALUES (?, ?)',
      [fcResult.insertId, req.params.id]
    );
    res.status(201).json({
      id:            fcResult.insertId,
      content:       contentObj,
      question:      contentObj.question,
      answer:        contentObj.answer,
      questionImage: questionImagePath,
      answerImage:   answerImagePath,
      difficult:     Number(difficult) || 0,
    });
  } catch (err) {
    console.error('POST /api/lessons/:id/flashcards:', err);
    // Cleanup: se ho salvato file su disco ma poi ho fallito il DB, li rimuovo
    const { deleteImageByPath } = require('../middleware/upload');
    await Promise.all(savedPaths.map(p => deleteImageByPath(p)));
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

module.exports = router;
