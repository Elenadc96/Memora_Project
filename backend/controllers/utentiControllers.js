const db = require('../models/db');

exports.getAll = (req, res) => {
  db.query('SELECT * FROM utenti', (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.getById = (req, res) => {
  db.query('SELECT * FROM utenti WHERE id = ?', [req.params.id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'Utente non trovato' });
    res.json(results[0]);
  });
};

exports.create = (req, res) => {
  const { name, lastName, email, password, settings } = req.body;
  db.query(
    'INSERT INTO utenti (name, lastName, email, password_hash, settings) VALUES (?, ?, ?, ?, ?)',
    [name, lastName, email, password, JSON.stringify(settings || null)],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ id: result.insertId, message: 'Utente creato' });
    }
  );
};

exports.update = (req, res) => {
  const { name, lastName, email, password, settings } = req.body;
  db.query(
    'UPDATE utenti SET name = ?, lastName = ?, email = ?, password_hash = ?, settings = ? WHERE id = ?',
    [name, lastName, email, password, JSON.stringify(settings || null), req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: 'Utente aggiornato' });
    }
  );
};

exports.remove = (req, res) => {
  db.query('DELETE FROM utenti WHERE id = ?', [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Utente eliminato' });
  });
};