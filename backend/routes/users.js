const express  = require('express');
const router   = express.Router();
const bcrypt   = require('bcrypt');
const jwt      = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const db       = require('../config/db');

// NOTA su { error: 'CODICE' }: i campi `error` in questo file sono codici
// stabili (es. 'PASSWORD_WRONG_CURRENT'), non frasi. Il frontend li traduce
// con $t('errors.<codice>') in base alla lingua dell'utente — se cambi il
// testo mostrato all'utente, modifica it.json/en.json, non questo file.

// v8 di express-rate-limit valida i keyGenerator custom: se possono ricadere
// su req.ip, l'IP va normalizzato con l'helper ipKeyGenerator (gestisce
// correttamente gli indirizzi IPv6, che altrimenti permetterebbero di
// aggirare il limite usando rappresentazioni diverse dello stesso indirizzo).
// Qui la ricaduta su IP scatta solo se req.user non è ancora popolato.
const passwordChangeLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  keyGenerator: (req) => (req.user?.id ? String(req.user.id) : ipKeyGenerator(req.ip)),
  handler: (_req, res) => res.status(429).json({ error: 'TOO_MANY_REQUESTS' }),
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
      if (!name.trim()) return res.status(400).json({ error: 'NAME_REQUIRED' });
      fields.push('name = ?');
      values.push(name.trim());
    }

    if (lastName !== undefined) {
      if (!lastName.trim()) return res.status(400).json({ error: 'LASTNAME_REQUIRED' });
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
      return res.status(400).json({ error: 'NO_DATA_TO_UPDATE' });
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
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// PATCH /api/utenti/password — cambia la password dell'utente loggato.
// Richiede la password attuale per conferma; in caso di successo riemette
// il cookie JWT così la sessione corrente rimane valida (Opzione A).
router.patch('/password', passwordChangeLimiter, async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'PASSWORD_FIELDS_REQUIRED' });
  }

  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'PASSWORD_TOO_SHORT' });
  }

  try {
    const [rows] = await db.query('SELECT password_hash FROM utenti WHERE id = ?', [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'USER_NOT_FOUND' });

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'PASSWORD_WRONG_CURRENT' });
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
    res.status(500).json({ error: 'SERVER_ERROR' });
  }
});

// DELETE /api/utenti — elimina l'account dell'utente loggato e tutti i dati correlati.
//
// Il CASCADE dello schema pulisce subject/lessons/flashcard_lesson/sessioni/
// user_badge/points quando si cancella la riga in utenti, ma NON tocca la
// tabella flashcard stessa (le flashcard diventerebbero orfane) — stessa
// situazione di DELETE /api/lessons/:id in routes/api.js, stessa soluzione:
// 1. si recuperano gli id delle flashcard dell'utente prima del CASCADE
// 2. si cancella l'utente (il CASCADE pulisce tutto il resto)
// 3. si cancellano le flashcard orfane con quegli id
router.delete('/', async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [fcRows] = await conn.query(
      `SELECT fl.flashcard_id
       FROM flashcard_lesson fl
       JOIN lessons l ON l.id = fl.lesson_id
       JOIN subject s ON s.id = l.subject_id
       WHERE s.user_id = ?`,
      [req.user.id]
    );
    const flashcardIds = fcRows.map(r => r.flashcard_id);

    await conn.query('DELETE FROM utenti WHERE id = ?', [req.user.id]);

    if (flashcardIds.length) {
      await conn.query('DELETE FROM flashcard WHERE id IN (?)', [flashcardIds]);
    }

    await conn.commit();
    res.clearCookie('access_token');
    res.json({ message: 'Account eliminato con successo' });
  } catch (err) {
    await conn.rollback();
    console.error('DELETE /api/utenti:', err);
    res.status(500).json({ error: 'SERVER_ERROR' });
  } finally {
    conn.release();
  }
});

module.exports = router;
