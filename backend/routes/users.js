const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// PATCH /api/utenti — aggiorna nome, cognome e/o le settings (tema, lingua)
// dell'utente loggato. L'id viene preso dal JWT (req.user, via middleware verifyToken).
router.patch('/', async (req, res) => {
  try {
    const { name, lastName, settings } = req.body;

    const fields = [];
    const values = [];

    if (name !== undefined) {
      if (!name.trim()) return res.status(400).json({ error: 'Il nome non può essere vuoto' });
      fields.push('name = ?');
      values.push(name.trim());
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) return res.status(400).json({ error: 'Il cognome non può essere vuoto' });
      fields.push('lastName = ?');
      values.push(lastName.trim());
    }

    if (settings !== undefined) {
      // settings è un blob unico (tema + lingua): a differenza di name/lastName
      // non ha colonne dedicate, quindi va sempre sovrascritto per intero.
      // È il frontend a doverlo inviare già completo ad ogni salvataggio.
      fields.push('settings = ?');
      values.push(JSON.stringify(settings));
    }

    if (!fields.length) {
      return res.status(400).json({ error: 'Nessun dato da aggiornare' });
    }

    values.push(req.user.id);
    await db.query(`UPDATE utenti SET ${fields.join(', ')} WHERE id = ?`, values);

    const [rows] = await db.query(
      'SELECT id, name, lastName, email, settings FROM utenti WHERE id = ?',
      [req.user.id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('PATCH /api/utenti:', err);
    res.status(500).json({ error: 'Errore nell\'aggiornamento dei dati utente' });
  }
});

module.exports = router;
