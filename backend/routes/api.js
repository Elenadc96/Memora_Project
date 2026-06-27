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

// GET /api/subjects — lista materie dell'utente autenticato con conteggio flashcard
router.get('/subjects', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT s.id, s.subjectName, s.description, s.color, s.emoji,
             COUNT(DISTINCT fl.flashcard_id) AS cardCount
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

// GET /api/subjects/:id/lessons — lezioni di una materia con conteggio flashcard
router.get('/subjects/:id/lessons', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.id, l.name, l.description, l.subject_id,
             l.status, l.last_study, l.last_lesson_duration, l.created_at,
             COUNT(fl.flashcard_id) AS flashcardCount
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
      SELECT f.id, f.content, f.difficult, f.created_at
      FROM flashcard f
      JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
      WHERE fl.lesson_id = ?
      ORDER BY f.created_at ASC
    `, [req.params.id]);
    // Spacchetta il JSON content in campi diretti per comodità del frontend
    const parsed = rows.map(r => ({
      ...r,
      question: r.content?.question ?? '',
      answer:   r.content?.answer   ?? '',
    }));
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

module.exports = router;
