const express     = require('express');
const router      = express.Router();
const db          = require('../config/db');
const verifyToken = require('../middleware/auth');

// ── Health check ──────────────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', message: 'Backend operativo', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database non raggiungibile' });
  }
});

// ── Subjects ──────────────────────────────────────────────────────────────

// GET /api/subjects — lista materie dell'utente autenticato con conteggio flashcard e mastered
router.get('/subjects', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.subjectName, s.description, s.color, s.emoji,
             COUNT(DISTINCT fl.flashcard_id)                AS cardCount,
             SUM(fl.status = 'mastered')                   AS masteredCount
      FROM subject s
      LEFT JOIN lessons l           ON l.subject_id  = s.id
      LEFT JOIN flashcard_lesson fl ON fl.lesson_id  = l.id
      WHERE s.user_id = ?
      GROUP BY s.id, s.subjectName, s.description, s.color, s.emoji
      ORDER BY s.subjectName ASC
    `, [req.user.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/subjects:', err);
    res.status(500).json({ error: 'Errore nel recupero delle materie' });
  }
});

// POST /api/subjects — crea nuova materia per l'utente autenticato
router.post('/subjects', verifyToken, async (req, res) => {
  try {
    const { subjectName, description, color, emoji } = req.body;
    if (!subjectName?.trim()) {
      return res.status(400).json({ error: 'Il nome della materia è obbligatorio' });
    }
    const [result] = await db.query(
      'INSERT INTO subject (user_id, subjectName, description, color, emoji) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, subjectName.trim(), description?.trim() || null, color || '#2563EB', emoji || '📚']
    );
    res.status(201).json({
      id: result.insertId,
      user_id: req.user.id,
      subjectName: subjectName.trim(),
      description: description?.trim() || '',
      color: color || '#2563EB',
      emoji: emoji || '📚',
      cardCount: 0,
    });
  } catch (err) {
    console.error('POST /api/subjects:', err);
    res.status(500).json({ error: 'Errore nella creazione della materia' });
  }
});

// PUT /api/subjects/:id — modifica materia
router.put('/subjects/:id', verifyToken, async (req, res) => {
  try {
    const { subjectName, description, color, emoji } = req.body;
    if (!subjectName?.trim()) {
      return res.status(400).json({ error: 'Il nome della materia è obbligatorio' });
    }
    const [result] = await db.query(
      'UPDATE subject SET subjectName = ?, description = ?, color = ?, emoji = ? WHERE id = ? AND user_id = ?',
      [subjectName.trim(), description?.trim() || null, color || '#2563EB', emoji || '📚', req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Materia non trovata' });
    res.json({ id: Number(req.params.id), subjectName: subjectName.trim(), description: description?.trim() || '', color: color || '#2563EB', emoji: emoji || '📚' });
  } catch (err) {
    console.error('PUT /api/subjects/:id:', err);
    res.status(500).json({ error: 'Errore nella modifica della materia' });
  }
});

// DELETE /api/subjects/:id — elimina materia e tutto il suo contenuto (CASCADE nel DB)
router.delete('/subjects/:id', verifyToken, async (req, res) => {
  try {
    const [result] = await db.query(
      'DELETE FROM subject WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Materia non trovata' });
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/subjects/:id:', err);
    res.status(500).json({ error: 'Errore nell\'eliminazione della materia' });
  }
});

// GET /api/subjects/:id — dettaglio singola materia
router.get('/subjects/:id', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.subjectName, s.description, s.color, s.emoji,
             COUNT(DISTINCT l.id)           AS lessonCount,
             COUNT(DISTINCT fl.flashcard_id) AS cardCount
      FROM subject s
      LEFT JOIN lessons l           ON l.subject_id  = s.id
      LEFT JOIN flashcard_lesson fl ON fl.lesson_id  = l.id
      WHERE s.id = ? AND s.user_id = ?
      GROUP BY s.id
    `, [req.params.id, req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Materia non trovata' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/subjects/:id:', err);
    res.status(500).json({ error: 'Errore nel recupero della materia' });
  }
});

// ── Lessons ───────────────────────────────────────────────────────────────

// GET /api/subjects/:id/lessons — lezioni con conteggio flashcard e progresso
router.get('/subjects/:id/lessons', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.id, l.name, l.description, l.subject_id,
             l.status, l.last_study, l.last_lesson_duration, l.created_at,
             COUNT(fl.flashcard_id)                                          AS flashcardCount,
             SUM(fl.status = 'mastered')                                     AS mastered_count,
             SUM(fl.status IN ('review', 'learning'))                         AS review_count
      FROM lessons l
      LEFT JOIN flashcard_lesson fl ON fl.lesson_id = l.id
      WHERE l.subject_id = ?
      GROUP BY l.id
      ORDER BY l.created_at ASC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/subjects/:id/lessons:', err);
    res.status(500).json({ error: 'Errore nel recupero delle lezioni' });
  }
});

// POST /api/subjects/:id/lessons — crea nuova lezione
router.post('/subjects/:id/lessons', async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Il nome della lezione è obbligatorio' });
    const [result] = await db.query(
      'INSERT INTO lessons (name, description, subject_id) VALUES (?, ?, ?)',
      [name.trim(), description?.trim() || null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM lessons WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...rows[0], flashcardCount: 0 });
  } catch (err) {
    console.error('POST /api/subjects/:id/lessons:', err);
    res.status(500).json({ error: 'Errore nella creazione della lezione' });
  }
});

// PATCH /api/lessons/:id — aggiorna status/last_study/last_lesson_duration dopo una sessione
router.patch('/lessons/:id', async (req, res) => {
  try {
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
    res.status(500).json({ error: "Errore nell'aggiornamento della lezione" });
  }
});

// DELETE /api/lessons/:id — elimina lezione + tutte le sue flashcard.
//
// Il CASCADE dello schema rimuove automaticamente le righe in flashcard_lesson
// quando si cancella una lesson, ma NON tocca la tabella flashcard stessa
// (le flashcard diventerebbero orfane). Per questo:
// 1. Si recuperano gli id delle flashcard legate a questa lezione
// 2. Si cancella la lezione (il CASCADE pulisce flashcard_lesson)
// 3. Si cancellano le flashcard orfane con quei id
router.delete('/lessons/:id', async (req, res) => {
  try {
    // 1. Trova le flashcard della lezione prima che il CASCADE le scolleghi
    const [fcRows] = await db.query(
      'SELECT flashcard_id FROM flashcard_lesson WHERE lesson_id = ?',
      [req.params.id]
    );
    const flashcardIds = fcRows.map(r => r.flashcard_id);

    // 2. Elimina la lezione → CASCADE rimuove le righe in flashcard_lesson
    await db.query('DELETE FROM lessons WHERE id = ?', [req.params.id]);

    // 3. Elimina le flashcard ora orfane
    if (flashcardIds.length > 0) {
      await db.query('DELETE FROM flashcard WHERE id IN (?)', [flashcardIds]);
    }

    res.json({ success: true, deletedFlashcards: flashcardIds.length });
  } catch (err) {
    console.error('DELETE /api/lessons/:id:', err);
    res.status(500).json({ error: 'Errore nell\'eliminazione della lezione' });
  }
});

// ── Flashcards ────────────────────────────────────────────────────────────

// GET /api/lessons/:id/flashcards — flashcard di una lezione
// Il campo content (JSON) viene spacchettato in question/answer per il frontend
router.get('/lessons/:id/flashcards', async (req, res) => {
  try {
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
        content:  c,
        question: c.question ?? '',
        answer:   c.answer   ?? '',
        status:   r.status ?? 'learning',
      };
    });
    res.json(parsed);
  } catch (err) {
    console.error('GET /api/lessons/:id/flashcards:', err);
    res.status(500).json({ error: 'Errore nel recupero delle flashcard' });
  }
});

// POST /api/lessons/:id/flashcards — crea flashcard in una lezione
router.post('/lessons/:id/flashcards', async (req, res) => {
  try {
    const { question, answer, difficult = 0 } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'Domanda e risposta sono obbligatorie' });
    }
    const content = JSON.stringify({ question: question.trim(), answer: answer.trim() });
    const [fcResult] = await db.query(
      'INSERT INTO flashcard (content, difficult) VALUES (?, ?)',
      [content, difficult]
    );
    await db.query(
      'INSERT INTO flashcard_lesson (flashcard_id, lesson_id) VALUES (?, ?)',
      [fcResult.insertId, req.params.id]
    );
    res.status(201).json({
      id: fcResult.insertId,
      content: { question: question.trim(), answer: answer.trim() },
      question: question.trim(),
      answer:   answer.trim(),
      difficult,
    });
  } catch (err) {
    console.error('POST /api/lessons/:id/flashcards:', err);
    res.status(500).json({ error: 'Errore nella creazione della flashcard' });
  }
});

// ── Sessioni ──────────────────────────────────────────────────────────────

// POST /api/sessions — salva i risultati di una sessione e aggiorna lo status per card
// Body: { subjectId, lessonId, duration, results: [{cardId, rating}] }
router.post('/sessions', async (req, res) => {
  try {
    const { subjectId, lessonId, duration = 0, results = [] } = req.body;
    if (!subjectId || !lessonId) return res.status(400).json({ error: 'subjectId e lessonId obbligatori' });

    const knew   = results.filter(r => r.rating === 'knew').length;
    const almost = results.filter(r => r.rating === 'almost').length;
    const forgot = results.filter(r => r.rating === 'forgot').length;
    const completed = results.length > 0 && forgot === 0 ? 1 : 0;

    const resultJson = JSON.stringify({ knew, almost, forgot, cards: results });

    // user_id = 1 placeholder fino all'implementazione dell'autenticazione
    const [row] = await db.query(
      `INSERT INTO sessioni (user_id, subject_id, lesson_id, result, last_usage_date, session_duration, completed)
       VALUES (1, ?, ?, ?, NOW(), ?, ?)`,
      [subjectId, lessonId, resultJson, duration, completed]
    );

    // Aggiorna lo status per ogni card in flashcard_lesson
    if (results.length > 0) {
      const statusMap = { knew: 'mastered', almost: 'learning', forgot: 'review' };
      await Promise.all(results.map(r =>
        db.query(
          'UPDATE flashcard_lesson SET status = ? WHERE flashcard_id = ? AND lesson_id = ?',
          [statusMap[r.rating] ?? 'learning', r.cardId, lessonId]
        )
      ));
    }

    res.status(201).json({ id: row.insertId, knew, almost, forgot, completed });
  } catch (err) {
    console.error('POST /api/sessions:', err);
    res.status(500).json({ error: 'Errore nel salvataggio della sessione' });
  }
});

// PUT /api/flashcards/:id — modifica domanda, risposta e difficoltà di una flashcard
router.put('/flashcards/:id', async (req, res) => {
  try {
    const { question, answer, difficult } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'Domanda e risposta sono obbligatorie' });
    }
    const content = JSON.stringify({ question: question.trim(), answer: answer.trim() });
    const [result] = await db.query(
      'UPDATE flashcard SET content = ?, difficult = ? WHERE id = ?',
      [content, difficult ?? 1, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Flashcard non trovata' });
    res.json({
      id: Number(req.params.id),
      question: question.trim(),
      answer: answer.trim(),
      difficult: difficult ?? 1,
    });
  } catch (err) {
    console.error('PUT /api/flashcards/:id:', err);
    res.status(500).json({ error: 'Errore nella modifica della flashcard' });
  }
});

// DELETE /api/flashcards/:id — elimina flashcard
router.delete('/flashcards/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM flashcard WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/flashcards/:id:', err);
    res.status(500).json({ error: 'Errore nell\'eliminazione della flashcard' });
  }
});

// ── Dashboard ─────────────────────────────────────────────────────────────

// GET /api/dashboard — aggregato per la dashboard: stat cards, grafico settimanale
router.get('/dashboard', verifyToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Totale flashcard dell'utente
    const [[{ totalFlashcards }]] = await db.query(`
      SELECT COUNT(DISTINCT fl.flashcard_id) AS totalFlashcards
      FROM flashcard_lesson fl
      JOIN lessons l ON l.id = fl.lesson_id
      JOIN subject s ON s.id = l.subject_id
      WHERE s.user_id = ?
    `, [userId]);

    // Flashcard studiate oggi e tempo di studio odierno
    const [[todayRow]] = await db.query(`
      SELECT
        COALESCE(SUM(
          JSON_EXTRACT(result, '$.knew') +
          JSON_EXTRACT(result, '$.almost') +
          JSON_EXTRACT(result, '$.forgot')
        ), 0) AS studiedToday,
        COALESCE(SUM(session_duration), 0) AS studyTimeMinutes
      FROM sessioni
      WHERE user_id = ? AND DATE(created_at) = CURDATE() AND result IS NOT NULL
    `, [userId]);

    // Tasso di successo: 30gg e storico in un'unica query
    // AVG ignora i NULL, quindi il CASE filtra efficacemente per finestra temporale
    const [[rateRow]] = await db.query(`
      SELECT
        ROUND(AVG(CASE
          WHEN (JSON_EXTRACT(result, '$.knew') + JSON_EXTRACT(result, '$.almost') + JSON_EXTRACT(result, '$.forgot')) > 0
          THEN JSON_EXTRACT(result, '$.knew') /
               (JSON_EXTRACT(result, '$.knew') + JSON_EXTRACT(result, '$.almost') + JSON_EXTRACT(result, '$.forgot')) * 100
        END)) AS successRateAll,
        ROUND(AVG(CASE
          WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            AND (JSON_EXTRACT(result, '$.knew') + JSON_EXTRACT(result, '$.almost') + JSON_EXTRACT(result, '$.forgot')) > 0
          THEN JSON_EXTRACT(result, '$.knew') /
               (JSON_EXTRACT(result, '$.knew') + JSON_EXTRACT(result, '$.almost') + JSON_EXTRACT(result, '$.forgot')) * 100
        END)) AS successRate30d
      FROM sessioni
      WHERE user_id = ? AND result IS NOT NULL
    `, [userId]);

    // Streak dall'utente
    const [[pointsRow]] = await db.query(`
      SELECT COALESCE(streak_days, 0) AS streak FROM points WHERE user_id = ?
    `, [userId]);

    // Attività settimanale: ultimi 7 giorni raggruppati per data
    const [weekRows] = await db.query(`
      SELECT
        DATE(created_at) AS day,
        COALESCE(SUM(
          JSON_EXTRACT(result, '$.knew') +
          JSON_EXTRACT(result, '$.almost') +
          JSON_EXTRACT(result, '$.forgot')
        ), 0) AS studied,
        COALESCE(SUM(JSON_EXTRACT(result, '$.knew')), 0) AS correct
      FROM sessioni
      WHERE user_id = ?
        AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
        AND result IS NOT NULL
      GROUP BY DATE(created_at)
    `, [userId]);

    // Costruisce array 7 giorni riempiendo i buchi con 0
    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      const found = weekRows.find(r => {
        const rDate = r.day instanceof Date
          ? r.day.toISOString().slice(0, 10)
          : String(r.day).slice(0, 10);
        return rDate === dateStr;
      });
      weeklyActivity.push({
        day: dayNames[d.getDay()],
        studied: found ? Number(found.studied) : 0,
        correct: found ? Number(found.correct) : 0,
      });
    }

    res.json({
      totalFlashcards:  Number(totalFlashcards),
      studiedToday:     Number(todayRow.studiedToday),
      studyTimeMinutes: Number(todayRow.studyTimeMinutes),
      successRate30d:   rateRow.successRate30d  != null ? Number(rateRow.successRate30d)  : null,
      successRateAll:   rateRow.successRateAll  != null ? Number(rateRow.successRateAll)  : null,
      streak:           pointsRow ? Number(pointsRow.streak) : 0,
      weeklyActivity,
    });
  } catch (err) {
    console.error('GET /api/dashboard:', err);
    res.status(500).json({ error: 'Errore nel recupero dei dati della dashboard' });
  }
});

module.exports = router;
