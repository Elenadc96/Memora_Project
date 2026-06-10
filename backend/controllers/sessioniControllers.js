const db = require('../models/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM sessioni', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const { user_id, subject_id, result, last_usage_date, session_duration, completed } = req.body;
  db.query(
    'INSERT INTO sessioni (user_id, subject_id, result, last_usage_date, session_duration, completed) VALUES (?, ?, ?, ?, ?, ?)',
    [user_id, subject_id, JSON.stringify(result || null), last_usage_date || null, session_duration || 0, completed ? 1 : 0],
    (err, resultDb) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: resultDb.insertId, message: 'Sessione creata' });
    }
  );
};

exports.update = (req, res) => {
  const { result, last_usage_date, session_duration, completed } = req.body;
  db.query(
    'UPDATE sessioni SET result = ?, last_usage_date = ?, session_duration = ?, completed = ? WHERE id = ?',
    [JSON.stringify(result || null), last_usage_date || null, session_duration, completed ? 1 : 0, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Sessione aggiornata' });
    }
  );
};

exports.remove = (req, res) => {
  db.query('DELETE FROM sessioni WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Sessione eliminata' });
  });
};