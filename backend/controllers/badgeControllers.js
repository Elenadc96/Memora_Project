const db = require('../models/db');

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