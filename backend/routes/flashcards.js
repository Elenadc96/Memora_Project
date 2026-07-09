const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// Montato in app.js su /api/flashcards con verifyToken a livello di mount.
//
// Stessa logica delle lezioni: una flashcard non ha user_id proprio, quindi
// l'ownership si verifica risalendo flashcard → flashcard_lesson → lessons →
// subject.user_id.
//
// I campi { error: 'CODICE' } sono codici stabili tradotti dal frontend
// ($t('errors.<codice>')) — vedi il commento in routes/subjects.js.

// PUT /api/flashcards/:id — modifica domanda, risposta e difficoltà di una flashcard
router.put('/:id', async (req, res) => {
  try {
    // Una flashcard non ha subject_id/user_id diretto: l'ownership si
    // verifica risalendo alla lezione (via flashcard_lesson) e da lì alla
    // materia dell'utente loggato.
    const [own] = await db.query(
      `SELECT f.id FROM flashcard f
       JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
       JOIN lessons l           ON l.id = fl.lesson_id
       JOIN subject s           ON s.id = l.subject_id
       WHERE f.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'FLASHCARD_NOT_FOUND' });

    const { question, answer, difficult } = req.body;
    if (!question?.trim() || !answer?.trim()) {
      return res.status(400).json({ error: 'FLASHCARD_QUESTION_ANSWER_REQUIRED' });
    }
    const content = JSON.stringify({ question: question.trim(), answer: answer.trim() });
    await db.query(
      'UPDATE flashcard SET content = ?, difficult = ? WHERE id = ?',
      [content, difficult ?? 1, req.params.id]
    );
    res.json({
      id: Number(req.params.id),
      question: question.trim(),
      answer: answer.trim(),
      difficult: difficult ?? 1,
    });
  } catch (err) {
    console.error('PUT /api/flashcards/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// DELETE /api/flashcards/:id — elimina flashcard
router.delete('/:id', async (req, res) => {
  try {
    const [own] = await db.query(
      `SELECT f.id FROM flashcard f
       JOIN flashcard_lesson fl ON fl.flashcard_id = f.id
       JOIN lessons l           ON l.id = fl.lesson_id
       JOIN subject s           ON s.id = l.subject_id
       WHERE f.id = ? AND s.user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!own.length) return res.status(404).json({ error: 'FLASHCARD_NOT_FOUND' });

    await db.query('DELETE FROM flashcard WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/flashcards/:id:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

module.exports = router;
