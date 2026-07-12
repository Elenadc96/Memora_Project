const express              = require('express');
const router               = express.Router();
const db                   = require('../config/db');
const { effectiveStreak }  = require('../services/gamificationService');

// Montato in app.js su /api/badge con verifyToken a livello di mount.

// GET /api/badge/me — tutti i badge con progresso/stato dell'utente autenticato,
// più i contatori grezzi (usati per il pannello "Le Tue Stats" nel frontend)
router.get('/me', async (req, res) => {
  try {
    const userId = req.user.id;

    const [statsRows] = await db.query(
      `SELECT total_point, streak_days, last_streak_date, cards_completed, perfect_sessions, is_speedster, is_night_owl
       FROM points WHERE user_id = ?`,
      [userId]
    );
    const s = statsRows[0] ?? {
      total_point: 0, streak_days: 0, cards_completed: 0,
      perfect_sessions: 0, is_speedster: 0, is_night_owl: 0,
    };

    const [badgeRows] = await db.query(
      `SELECT b.id, b.icon, b.goal,
              COALESCE(ub.progress, 0) AS progress,
              COALESCE(ub.unlocked, 0) AS unlocked,
              ub.unlocked_at
       FROM badge b
       LEFT JOIN user_badge ub ON ub.badge_id = b.id AND ub.user_id = ?
       ORDER BY b.id ASC`,
      [userId]
    );

    res.json({
      badges: badgeRows.map(b => ({
        id: b.id,
        icon: b.icon,
        total: b.goal,
        progress: Number(b.progress),
        unlocked: !!b.unlocked,
        unlockedDate: b.unlocked ? b.unlocked_at : null,
      })),
      stats: {
        totalPoints: Number(s.total_point),
        streak: effectiveStreak(Number(s.streak_days), s.last_streak_date),
        cardsCompleted: Number(s.cards_completed),
        perfectSessions: Number(s.perfect_sessions),
        isSpeedster: !!s.is_speedster,
        isNightOwl: !!s.is_night_owl,
      },
    });
  } catch (err) {
    console.error('GET /api/badge/me:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

module.exports = router;
