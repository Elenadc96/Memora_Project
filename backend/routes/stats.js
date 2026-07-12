const express          = require('express');
const router           = express.Router();
const db               = require('../config/db');
const verifyToken      = require('../middleware/auth');
const { effectiveStreak } = require('../services/gamificationService');

// Montato in app.js su /api SENZA verifyToken a livello di mount, perché
// /status è l'unico endpoint pubblico dell'API (health check): dashboard e
// ranking applicano verifyToken per-rotta qui sotto.
//
// I campi { error: 'CODICE' } sono codici stabili tradotti dal frontend
// ($t('errors.<codice>')) — vedi il commento in routes/subjects.js.

// ── Health check ──────────────────────────────────────────────────────────
router.get('/status', async (req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok', message: 'Backend operativo', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database non raggiungibile' });
  }
});

// ── Ranking ───────────────────────────────────────────────────────────────

// GET /api/ranking — classifica globale ordinata per punti totali (top 50)
// A parità di punti vince chi è stato attivo più di recente (last_streak_date);
// u.id resta come ultimo spareggio deterministico se anche quella coincide.
router.get('/ranking', verifyToken, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.id AS userId, u.name, u.lastName,
             COALESCE(p.total_point, 0) AS points,
             COALESCE(p.streak_days, 0) AS streak,
             p.last_streak_date
      FROM utenti u
      JOIN points p ON p.user_id = u.id
      ORDER BY p.total_point DESC, p.last_streak_date DESC, u.id ASC
      LIMIT 50
    `);

    const ranking = rows.map((r, i) => ({
      rank: i + 1,
      userId: r.userId,
      name: `${r.name} ${r.lastName}`,
      points: Number(r.points),
      streak: effectiveStreak(Number(r.streak), r.last_streak_date),
      isCurrentUser: r.userId === req.user.id,
    }));

    res.json(ranking);
  } catch (err) {
    console.error('GET /api/ranking:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
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
        COALESCE(SUM(session_duration), 0) AS studyTimeSeconds
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
      SELECT COALESCE(streak_days, 0) AS streak, last_streak_date FROM points WHERE user_id = ?
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
    //
    // NOTA sul confronto delle date: qui NON si può usare toISOString() per
    // trasformare una data in stringa "YYYY-MM-DD", perché toISOString()
    // converte sempre in UTC. mysql2 restituisce le colonne DATE (come
    // `day` qui sotto) come oggetti Date che rappresentano la MEZZANOTTE
    // LOCALE di quel giorno — e con un fuso avanti rispetto a UTC (es.
    // Europe/Berlin, +2h d'estate), la mezzanotte locale corrisponde alle
    // 22:00 del giorno UTC precedente. toISOString() la riporterebbe quindi
    // al giorno prima, facendo "scivolare indietro" ogni sessione di un
    // giorno rispetto a "oggi" (calcolato invece con l'orario locale reale,
    // non di mezzanotte, che raramente attraversa quel confine). Per questo
    // si leggono sempre i componenti locali della data (getFullYear/
    // getMonth/getDate), mai la rappresentazione UTC.
    const toLocalDateStr = (d) => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const dayNames = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
    const weeklyActivity = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = toLocalDateStr(d);
      const found = weekRows.find(r => {
        const rDate = r.day instanceof Date ? toLocalDateStr(r.day) : String(r.day).slice(0, 10);
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
      studyTimeSeconds: Number(todayRow.studyTimeSeconds),
      successRate30d:   rateRow.successRate30d  != null ? Number(rateRow.successRate30d)  : null,
      successRateAll:   rateRow.successRateAll  != null ? Number(rateRow.successRateAll)  : null,
      streak:           pointsRow ? effectiveStreak(Number(pointsRow.streak), pointsRow.last_streak_date) : 0,
      weeklyActivity,
    });
  } catch (err) {
    console.error('GET /api/dashboard:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

module.exports = router;
