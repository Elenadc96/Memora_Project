const db = require('../models/db');
const pool = require('../config/db');

// GET /api/badge/me — tutti i badge con progresso/stato dell'utente autenticato,
// più i contatori grezzi (usati per il pannello "Le Tue Stats" nel frontend)
exports.getMine = async (req, res) => {
  try {
    const userId = req.user.id;

    const [statsRows] = await pool.query(
      `SELECT total_point, streak_days, cards_completed, perfect_sessions, is_speedster, is_night_owl
       FROM points WHERE user_id = ?`,
      [userId]
    );
    const s = statsRows[0] ?? {
      total_point: 0, streak_days: 0, cards_completed: 0,
      perfect_sessions: 0, is_speedster: 0, is_night_owl: 0,
    };

    const [badgeRows] = await pool.query(
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
        streak: Number(s.streak_days),
        cardsCompleted: Number(s.cards_completed),
        perfectSessions: Number(s.perfect_sessions),
        isSpeedster: !!s.is_speedster,
        isNightOwl: !!s.is_night_owl,
      },
    });
  } catch (err) {
    console.error('GET /api/badge/me:', err);
    res.status(500).json({ error: 'Errore nel recupero dei badge' });
  }
};

exports.getAll = (req, res) => {
  db.query('SELECT * FROM badge', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const { name, description, icon, type, goal } = req.body;
  db.query(
    'INSERT INTO badge (name, description, icon, type, goal) VALUES (?, ?, ?, ?, ?)',
    [name, description, icon, type, goal],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Badge creato' });
    }
  );
};

exports.update = (req, res) => {
  const { name, description, icon, type, goal } = req.body;
  db.query(
    'UPDATE badge SET name = ?, description = ?, icon = ?, type = ?, goal = ? WHERE id = ?',
    [name, description, icon, type, goal, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Badge aggiornato' });
    }
  );
};

exports.remove = (req, res) => {
  db.query('DELETE FROM badge WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Badge eliminato' });
  });
};