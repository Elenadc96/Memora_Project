const db = require('../models/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM points', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const { user_id, total_point, streak_days, last_streak_date } = req.body;
  db.query(
    'INSERT INTO points (user_id, total_point, streak_days, last_streak_date) VALUES (?, ?, ?, ?)',
    [user_id, total_point || 0, streak_days || 0, last_streak_date || null],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Record punti creato' });
    }
  );
};

exports.update = (req, res) => {
  const { total_point, streak_days, last_streak_date } = req.body;
  db.query(
    'UPDATE points SET total_point = ?, streak_days = ?, last_streak_date = ? WHERE user_id = ?',
    [total_point, streak_days, last_streak_date || null, req.params.userId],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Punti aggiornati' });
    }
  );
};

exports.remove = (req, res) => {
  db.query('DELETE FROM points WHERE user_id = ?', [req.params.userId], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Punti eliminati' });
  });
};