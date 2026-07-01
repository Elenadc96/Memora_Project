const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const db       = require('../config/db');

// v8 di express-rate-limit valida i keyGenerator custom: se possono ricadere
// su req.ip, l'IP va normalizzato con l'helper ipKeyGenerator (gestisce
// correttamente gli indirizzi IPv6, che altrimenti permetterebbero di
// aggirare il limite usando rappresentazioni diverse dello stesso indirizzo).
// Qui la ricaduta su IP scatta solo se req.user non è ancora popolato.
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.user?.id ? String(req.user.id) : ipKeyGenerator(req.ip)),
  handler: (_req, res) => res.status(429).json({ error: 'Troppi tentativi. Riprova tra 15 minuti.' }),
  standardHeaders: true,
  legacyHeaders: false,
});

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

// PATCH /api/utenti/password — cambia la password dell'utente loggato.
// Richiede la password attuale per conferma; in caso di successo riemette
// il cookie JWT così la sessione corrente rimane valida (Opzione A).
router.patch('/password', passwordChangeLimiter, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Dati mancanti' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'La nuova password deve avere almeno 8 caratteri' });
  }

  try {
    const [rows] = await db.query('SELECT password_hash FROM utenti WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Utente non trovato' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Password attuale non corretta' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE utenti SET password_hash = ? WHERE id = ?', [newHash, req.user.id]);

    // Re-emette il cookie con un token fresco: la sessione corrente resta valida,
    // le eventuali altre sessioni scadranno entro 2 ore per design del JWT.
    const token = jwt.sign({ id: req.user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.cookie('access_token', token, {
      httpOnly: true,
      sameSite: 'Strict',
      maxAge: 7200000,
    });

    res.json({ message: 'Password aggiornata con successo' });
  } catch (err) {
    console.error('PATCH /api/utenti/password:', err);
    res.status(500).json({ error: 'Errore interno al server' });
  }
});

// TODO: DELETE /api/utenti — elimina l'account dell'utente loggato e tutti i dati correlati
// (subject, lessons, flashcard_lesson, sessioni, badge, points). Richiede conferma password.

module.exports = router;
