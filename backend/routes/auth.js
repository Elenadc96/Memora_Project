const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const db = require('../config/db');
const { isValidPassword } = require('../utils/validators');

// NOTA su { error: 'CODICE' }: i campi `error` in questo file sono codici
// stabili (es. 'INVALID_CREDENTIALS'), non frasi. Il frontend li traduce con
// $t('errors.<codice>') in base alla lingua dell'utente — se cambi il testo
// mostrato all'utente, modifica it.json/en.json, non questo file.

// Senza questo limite, chiunque potrebbe tentare password a raffica contro
// un account (brute force) senza alcun blocco: prima di questo fix il login
// non aveva NESSUN rate limiting, a differenza del cambio password che lo
// ha già (vedi users.js). La chiave è l'IP (non l'utente: non è ancora
// autenticato quando arriva qui) — ipKeyGenerator normalizza l'IPv6 come
// richiesto da express-rate-limit v8.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => ipKeyGenerator(req.ip),
  handler: (_req, res) => res.status(429).json({ error: 'TOO_MANY_REQUESTS' }),
  standardHeaders: true,
  legacyHeaders: false,
});

// --- REGISTRAZIONE ---
router.post('/register', async (req, res) => {
    // 1. Usa 'password' (nome inviato dal frontend) non 'password_hash'
    // 'settings' (lingua/tema di default) viene calcolato dal frontend, che
    // ha accesso alle preferenze del browser (prefers-color-scheme).
    const { email, password, name, lastName, settings } = req.body;

    if (!isValidPassword(password)) {
        return res.status(400).json({ error: 'PASSWORD_WEAK' });
    }

    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();

        // Controllo preventivo: l'utente esiste già?
        const [existing] = await conn.query('SELECT id FROM utenti WHERE email = ?', [email]);
        if (existing.length > 0) {
            await conn.rollback();
            return res.status(400).json({ error: "EMAIL_ALREADY_REGISTERED" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const initialSettings = settings || {};

        const sql = 'INSERT INTO utenti (email, password_hash, name, lastName, settings) VALUES (?, ?, ?, ?, ?)';
        const [result] = await conn.query(sql, [email, hashedPassword, name, lastName, JSON.stringify(initialSettings)]);

        // Riga punti/streak per il ranking, così il nuovo utente compare
        // subito in classifica (con 0 punti) invece di esserne escluso.
        // Eseguita nella stessa transazione: se fallisce, l'utente non viene creato.
        await conn.query('INSERT INTO points (user_id) VALUES (?)', [result.insertId]);

        await conn.commit();

        const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: '2h' });
        const user = { id: result.insertId, email, name, lastName, settings: initialSettings };

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            maxAge: 7200000
        }).status(201).json({ message: "Registrazione completata", user });

    } catch (err) {
        await conn.rollback();
        console.error("ERRORE DURANTE LA REGISTRAZIONE:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    } finally {
        conn.release();
    }
});

// --- LOGIN ---
router.post('/login', loginLimiter, async (req, res) => {
    // 2. Ricevi 'password' dal frontend (non 'password_hash')
    const { email, password } = req.body;
    
    try {
        const [rows] = await db.query('SELECT * FROM utenti WHERE email = ?', [email]);
        
        // Messaggio generico per sicurezza (stesso codice sia email inesistente
        // che password errata, per non rivelare quale delle due sia sbagliata)
        if (rows.length === 0) {
            return res.status(401).json({ error: "INVALID_CREDENTIALS" });
        }

        const user = rows[0];

        // 3. Confronto tra password (chiaro) e password_hash (DB)
        // Se uno dei due è undefined, bcrypt lancia l'errore "data and hash arguments required"
        const validPass = await bcrypt.compare(password, user.password_hash);

        if (!validPass) {
            return res.status(401).json({ error: "INVALID_CREDENTIALS" });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.cookie('access_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production', // Solo HTTPS in produzione
            sameSite: 'Strict',
            maxAge: 7200000
        }).json({
            user: { id: user.id, name: user.name, lastName: user.lastName, email: user.email }
        });

    } catch (err) {
        console.error("DETTAGLIO ERRORE LOGIN:", err);
        res.status(500).json({ error: "SERVER_ERROR" });
    }
});

// --- SESSIONE CORRENTE ---
router.get('/me', async (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({ error: "AUTH_REQUIRED" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Dati letti dal DB (non dal token), così sono sempre aggiornati
        // rispetto a eventuali modifiche fatte dalla pagina Impostazioni.
        const [rows] = await db.query(
            'SELECT id, name, lastName, email, settings FROM utenti WHERE id = ?',
            [verified.id]
        );
        if (!rows.length) return res.status(401).json({ error: "USER_NOT_FOUND" });

        res.json(rows[0]);
    } catch {
        res.status(401).json({ error: "AUTH_INVALID_TOKEN" });
    }
});

// --- LOGOUT ---
router.post('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.json({ message: "Logout effettuato" });
});

module.exports = router;