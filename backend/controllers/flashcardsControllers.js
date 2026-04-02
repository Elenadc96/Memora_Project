const db = require('../models/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM flashcard', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.create = (req, res) => {
  const { content, difficult } = req.body;
  db.query(
    'INSERT INTO flashcard (content, difficult) VALUES (?, ?)',
    [JSON.stringify(content), difficult || 0],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Flashcard creata' });
    }
  );
};

exports.update = (req, res) => {
  const { content, difficult } = req.body;
  db.query(
    'UPDATE flashcard SET content = ?, difficult = ? WHERE id = ?',
    [JSON.stringify(content), difficult, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Flashcard aggiornata' });
    }
  );
};

exports.remove = (req, res) => {
  db.query('DELETE FROM flashcard WHERE id = ?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Flashcard eliminata' });
  });
};