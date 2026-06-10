const db = require('../models/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM subject', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getByUser = (req, res) => {
  db.query('SELECT * FROM subject WHERE user_id = ?', [req.params.userId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const { user_id, subjectName, description } = req.body;
  db.query(
    'INSERT INTO subject (user_id, subjectName, description) VALUES (?, ?, ?)',
    [user_id, subjectName, description],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Materia creata' });
    }
  );
};

exports.update = (req, res) => {
  const { subjectName, description } = req.body;
  db.query(
    'UPDATE subject SET subjectName = ?, description = ? WHERE id = ?',
    [subjectName, description, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Materia aggiornata' });
    }
  );
};

exports.remove = (req, res) => {
  db.query('DELETE FROM subject WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Materia eliminata' });
  });
};