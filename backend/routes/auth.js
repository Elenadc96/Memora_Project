const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const db = require('../config/db'); 

// --- REGISTRAZIONE ---
router.post('/register', async (req, res) => {
    // 1. Usa 'password' (nome inviato dal frontend) non 'password_hash'
    // 'settings' (lingua/tema di default) viene calcolato dal frontend, che
    // ha accesso alle preferenze del browser (prefers-color-scheme).
    const { email, password, name, lastName, settings } = req.body;

    try {
        // Controllo preventivo: l'utente esiste già?
        const [existing] = await db.query('SELECT id FROM utenti WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: "Email già registrata" });
        }

        // Hashing della password (sicurezza richiesta dalle specifiche)
        const hashedPassword = await bcrypt.hash(password, 10);
        const initialSettings = settings || {};

        const sql = 'INSERT INTO utenti (email, password_hash, name, lastName, settings) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [email, hashedPassword, name, lastName, JSON.stringify(initialSettings)]);

        // Riga punti/streak per il ranking, così il nuovo utente compare
        // subito in classifica (con 0 punti) invece di esserne escluso.
        await db.query('INSERT INTO points (user_id) VALUES (?)', [result.insertId]);

        // Creazione Token JWT [3, 4]
        const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: '2h' });

        // FONDAMENTALE: Invia l'oggetto user al frontend per evitare il pop-up di errore
        const user = { id: result.insertId, email, name, lastName, settings: initialSettings };

        res.cookie('access_token', token, {
            httpOnly: true, // Sicurezza XSS 
            sameSite: 'Strict', // Sicurezza CSRF 
            maxAge: 7200000 
        }).status(201).json({ message: "Registrazione completata", user });

    } catch (err) {
        console.error("ERRORE DURANTE LA REGISTRAZIONE:", err);
        res.status(500).json({ error: "Errore interno al server", details: err.message });
    }
});

// --- LOGIN ---
router.post('/login', async (req, res) => {
    // 2. Ricevi 'password' dal frontend (non 'password_hash')
    const { email, password } = req.body;
    
    try {
        const [rows] = await db.query('SELECT * FROM utenti WHERE email = ?', [email]);
        
        // Messaggio generico per sicurezza 
        if (rows.length === 0) {
            return res.status(401).json({ error: "Credenziali errate" });
        }

        const user = rows[0];

        // 3. Confronto tra password (chiaro) e password_hash (DB)
        // Se uno dei due è undefined, bcrypt lancia l'errore "data and hash arguments required"
        const validPass = await bcrypt.compare(password, user.password_hash);
        
        if (!validPass) {
            return res.status(401).json({ error: "Credenziali errate" });
        }

        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '2h' });

        res.cookie('access_token', token, {
            httpOnly: true,
            sameSite: 'Strict',
            maxAge: 7200000
        }).json({ 
            user: { id: user.id, name: user.name, lastName: user.lastName, email: user.email } 
        });

    } catch (err) {
        console.error("DETTAGLIO ERRORE LOGIN:", err);
        res.status(500).json({ error: "Errore interno al server" });
    }
});

// --- SESSIONE CORRENTE ---
router.get('/me', async (req, res) => {
    const token = req.cookies.access_token;
    if (!token) return res.status(401).json({ error: "Non autenticato" });

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET);

        // Dati letti dal DB (non dal token), così sono sempre aggiornati
        // rispetto a eventuali modifiche fatte dalla pagina Impostazioni.
        const [rows] = await db.query(
            'SELECT id, name, lastName, email, settings FROM utenti WHERE id = ?',
            [verified.id]
        );
        if (!rows.length) return res.status(401).json({ error: "Utente non trovato" });

        res.json(rows[0]);
    } catch {
        res.status(401).json({ error: "Token non valido o scaduto" });
    }
});

// --- LOGOUT ---
router.post('/logout', (req, res) => {
    res.clearCookie('access_token');
    res.json({ message: "Logout effettuato" });
});

module.exports = router;