const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/status — health check, usato dal frontend per verificare la connessione
router.get('/status', async (req, res) => {
  try {
    await db.promise().query('SELECT 1');
    res.json({ status: 'ok', message: 'Backend operativo', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database non raggiungibile' });
  }
});

// GET /api/subjects — restituisce le materie con il conteggio delle flashcard.
// Il cardCount è calcolato con JOIN su lessons → flashcard_lesson.
// TODO: quando l'autenticazione sarà implementata, aggiungere il filtro
//       WHERE s.user_id = req.user.id  per restituire solo le materie dell'utente loggato.
router.get('/subjects', async (req, res) => {
  try {
    const [rows] = await db.promise().query(`
      SELECT
        s.id,
        s.subjectName,
        s.description,
        s.color,
        COUNT(DISTINCT fl.flashcard_id) AS cardCount
      FROM subject s
      LEFT JOIN lessons l         ON l.subject_id  = s.id
      LEFT JOIN flashcard_lesson fl ON fl.lesson_id = l.id
      GROUP BY s.id, s.subjectName, s.description, s.color
      ORDER BY s.subjectName ASC
    `);
    res.json(rows);
  } catch (err) {
    console.error('GET /api/subjects:', err);
    res.status(500).json({ error: 'Errore nel recupero delle materie' });
  }
});

module.exports = router;
