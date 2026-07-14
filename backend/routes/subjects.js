const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { deleteContentImages } = require('../middleware/upload');

// Montato in app.js su /api/subjects con verifyToken a livello di mount:
// tutte le rotte qui dentro hanno già req.user valorizzato.
//
// NOTA su { error: 'CODICE' }: i campi `error` sono codici stabili
// (es. 'SUBJECT_NOT_FOUND'), non frasi. Il frontend li traduce con
// $t('errors.<codice>') in base alla lingua dell'utente — se cambi il testo
// mostrato all'utente, modifica it.json/en.json, non questo file. Gli errori
// 500 imprevisti usano tutti il codice generico 'SERVER_ERROR': i dettagli
// veri restano solo nel log lato server (console.error), non nella risposta.

// GET /api/subjects — lista materie dell'utente autenticato con conteggio flashcard e mastered
router.get('/', async (req, res) => {
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
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// POST /api/subjects — crea nuova materia per l'utente autenticato
router.post('/', async (req, res) => {
  try {
    const { subjectName, description, color, emoji } = req.body;
    if (!subjectName?.trim()) {
      return res.status(400).json({ error: 'SUBJECT_NAME_REQUIRED' });
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
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// GET /api/subjects/:id — dettaglio singola materia
router.get('/:id', async (req, res) => {
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
    if (!rows.length) return res.status(404).json({ error: 'SUBJECT_NOT_FOUND' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET /api/subjects/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// PUT /api/subjects/:id — modifica materia
router.put('/:id', async (req, res) => {
  try {
    const { subjectName, description, color, emoji } = req.body;
    if (!subjectName?.trim()) {
      return res.status(400).json({ error: 'SUBJECT_NAME_REQUIRED' });
    }
    const [result] = await db.query(
      'UPDATE subject SET subjectName = ?, description = ?, color = ?, emoji = ? WHERE id = ? AND user_id = ?',
      [subjectName.trim(), description?.trim() || null, color || '#2563EB', emoji || '📚', req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'SUBJECT_NOT_FOUND' });
    res.json({ id: Number(req.params.id), subjectName: subjectName.trim(), description: description?.trim() || '', color: color || '#2563EB', emoji: emoji || '📚' });
  } catch (err) {
    console.error('PUT /api/subjects/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// DELETE /api/subjects/:id — elimina materia e tutto il suo contenuto.
//
// Il CASCADE dello schema rimuove automaticamente le righe in lessons e
// flashcard_lesson quando si cancella una subject, ma NON tocca la tabella
// flashcard stessa (le flashcard diventerebbero orfane) — stessa situazione
// di DELETE /api/lessons/:id, stessa soluzione:
// 1. si recuperano gli id delle flashcard di tutte le lezioni della materia
// 2. si cancella la materia (il CASCADE pulisce lessons e flashcard_lesson)
// 3. si cancellano le flashcard ora orfane con quegli id
router.delete('/:id', async (req, res) => {
  try {
    const [fcRows] = await db.query(
      `SELECT f.id AS flashcard_id, f.content
       FROM flashcard f
       JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
       JOIN lessons l ON l.id = fl.lesson_id
       WHERE l.subject_id = ?`,
      [req.params.id]
    );
    const flashcardIds = fcRows.map(r => r.flashcard_id);

    // Cancella i file immagine prima di perdere i riferimenti (best-effort)
    await Promise.all(fcRows.map(r => deleteContentImages(r.content)));

    const [result] = await db.query(
      'DELETE FROM subject WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'SUBJECT_NOT_FOUND' });

    if (flashcardIds.length > 0) {
      await db.query('DELETE FROM flashcard WHERE id IN (?)', [flashcardIds]);
    }

    res.json({ success: true, deletedFlashcards: flashcardIds.length });
  } catch (err) {
    console.error('DELETE /api/subjects/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// GET /api/subjects/:id/lessons — lezioni con conteggio flashcard e progresso
router.get('/:id/lessons', async (req, res) => {
  try {
    const [subjectRows] = await db.query(
      'SELECT id FROM subject WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!subjectRows.length) return res.status(404).json({ error: 'SUBJECT_NOT_FOUND' });

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
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// POST /api/subjects/:id/lessons — crea nuova lezione
router.post('/:id/lessons', async (req, res) => {
  try {
    const [subjectRows] = await db.query(
      'SELECT id FROM subject WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!subjectRows.length) return res.status(404).json({ error: 'SUBJECT_NOT_FOUND' });

    const { name, description } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'LESSON_NAME_REQUIRED' });
    const [result] = await db.query(
      'INSERT INTO lessons (name, description, subject_id) VALUES (?, ?, ?)',
      [name.trim(), description?.trim() || null, req.params.id]
    );
    const [rows] = await db.query('SELECT * FROM lessons WHERE id = ?', [result.insertId]);
    res.status(201).json({ ...rows[0], flashcardCount: 0 });
  } catch (err) {
    console.error('POST /api/subjects/:id/lessons:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

module.exports = router;
