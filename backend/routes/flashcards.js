const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { userOwnsFlashcard } = require('../helpers/ownership');
const {
  flashcardImagesUpload,
  handleUploadError,
  saveImage,
  deleteImageByPath,
  deleteContentImages,
} = require('../middleware/upload');

// Montato in app.js su /api/flashcards con verifyToken a livello di mount.
//
// Stessa logica delle lezioni: una flashcard non ha user_id proprio, quindi
// l'ownership si verifica risalendo flashcard → flashcard_lesson → lessons →
// subject.user_id.
//
// I campi { error: 'CODICE' } sono codici stabili tradotti dal frontend
// ($t('errors.<codice>')) — vedi il commento in routes/subjects.js.

// PUT /api/flashcards/:id — modifica domanda, risposta, difficoltà e immagini
//
// Ogni immagine ha 3 stati possibili nel body multipart:
//   - assente          → tieni quella corrente (nessun cambio)
//   - file allegato    → sostituisce quella corrente (la vecchia viene cancellata)
//   - removeXxxImage=1 → rimuovi quella corrente senza sostituirla
router.put('/:id', flashcardImagesUpload, handleUploadError, async (req, res) => {
  const newlySavedPaths = [];
  try {
    if (!(await userOwnsFlashcard(req.user.id, req.params.id))) {
      return res.status(404).json({ error: 'FLASHCARD_NOT_FOUND' });
    }

    const { question, answer, difficult, removeQuestionImage, removeAnswerImage } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'FLASHCARD_QUESTION_ANSWER_REQUIRED' });
    }

    // Rileggo il content attuale per sapere quali immagini esistono già
    const [rows] = await db.query('SELECT content FROM flashcard WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'FLASHCARD_NOT_FOUND' });
    const currentContent = typeof rows[0].content === 'string'
      ? JSON.parse(rows[0].content)
      : (rows[0].content ?? {});

    // Calcola i nuovi path applicando la logica "keep / replace / remove"
    const nextQuestionImage = await resolveImageField(
      req.files?.questionImage?.[0],
      currentContent.questionImage,
      removeQuestionImage,
      newlySavedPaths,
    );
    const nextAnswerImage = await resolveImageField(
      req.files?.answerImage?.[0],
      currentContent.answerImage,
      removeAnswerImage,
      newlySavedPaths,
    );

    const contentObj = {
      question: question.trim(),
      answer:   answer.trim(),
      ...(nextQuestionImage && { questionImage: nextQuestionImage }),
      ...(nextAnswerImage   && { answerImage:   nextAnswerImage   }),
    };

    await db.query(
      'UPDATE flashcard SET content = ?, difficult = ? WHERE id = ?',
      [JSON.stringify(contentObj), Number(difficult) || 0, req.params.id]
    );

    // Solo DOPO il commit sul DB cancello le vecchie immagini che sono state
    // sostituite o rimosse — così se il DB fallisce, i file vecchi restano
    // referenziati dal record e non ho perso nulla.
    const toRemove = [];
    if (currentContent.questionImage && currentContent.questionImage !== nextQuestionImage) {
      toRemove.push(currentContent.questionImage);
    }
    if (currentContent.answerImage && currentContent.answerImage !== nextAnswerImage) {
      toRemove.push(currentContent.answerImage);
    }
    await Promise.all(toRemove.map(p => deleteImageByPath(p)));

    res.json({
      id:            Number(req.params.id),
      question:      contentObj.question,
      answer:        contentObj.answer,
      questionImage: nextQuestionImage,
      answerImage:   nextAnswerImage,
      difficult:     Number(difficult) || 0,
    });
  } catch (err) {
    console.error('PUT /api/flashcards/:id:', err);
    // Se ho creato nuovi file ma poi qualcosa è fallito, li rimuovo per non
    // lasciare file orfani non referenziati da nessun record.
    await Promise.all(newlySavedPaths.map(p => deleteImageByPath(p)));
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// DELETE /api/flashcards/:id — elimina flashcard + immagini associate
router.delete('/:id', async (req, res) => {
  try {
    if (!(await userOwnsFlashcard(req.user.id, req.params.id))) {
      return res.status(404).json({ error: 'FLASHCARD_NOT_FOUND' });
    }

    // Prima leggo il content per sapere quali file cancellare, POI cancello
    // il record dal DB (il CASCADE su flashcard_lesson pulisce da solo).
    const [rows] = await db.query('SELECT content FROM flashcard WHERE id = ?', [req.params.id]);
    if (rows.length > 0) {
      await deleteContentImages(rows[0].content);
    }

    await db.query('DELETE FROM flashcard WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/flashcards/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// Helper: decide che valore mettere nel content per un campo immagine,
// tenendo traccia dei nuovi file salvati (per il cleanup in caso di errore).
async function resolveImageField(uploadedFile, currentPath, removeFlag, savedPathsAccumulator) {
  if (uploadedFile) {
    const newPath = await saveImage(uploadedFile.buffer);
    savedPathsAccumulator.push(newPath);
    return newPath;
  }
  // Il flag arriva come stringa da multipart, non come booleano
  if (removeFlag === 'true' || removeFlag === '1') {
    return null;
  }
  return currentPath ?? null;
}

module.exports = router;
