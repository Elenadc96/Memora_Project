const db = require('../models/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM lessons', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getBySubject = (req, res) => {
  db.query('SELECT * FROM lessons WHERE subject_id = ?', [req.params.subjectId], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const { name, description, subject_id, status, last_study, last_lesson_duration } = req.body;
  db.query(
    'INSERT INTO lessons (name, description, subject_id, status, last_study, last_lesson_duration) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, subject_id, status || 0, last_study || null, last_lesson_duration || 0],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Lezione creata' });
    }
  );
};

exports.update = (req, res) => {
  const { name, description, subject_id, status, last_study, last_lesson_duration } = req.body;
  db.query(
    'UPDATE lessons SET name = ?, description = ?, subject_id = ?, status = ?, last_study = ?, last_lesson_duration = ? WHERE id = ?',
    [name, description, subject_id, status, last_study, last_lesson_duration, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Lezione aggiornata' });
    }
  );
};

exports.remove = (req, res) => {
  db.query('DELETE FROM lessons WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Lezione eliminata' });
  });
};