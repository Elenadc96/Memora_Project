const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt'); 
const jwt = require('jsonwebtoken'); 
const db = require('../config/db'); 

// --- REGISTRAZIONE ---
router.post('/register', async (req, res) => {
    // 1. Usa 'password' (nome inviato dal frontend) non 'password_hash'
    const { email, password, name, lastName } = req.body;
    
    try {
        // Controllo preventivo: l'utente esiste già?
        const [existing] = await db.query('SELECT id FROM utenti WHERE email = ?', [email]);
        if (existing.length > 0) {
            return res.status(400).json({ error: "Email già registrata" });
        }

        // Hashing della password (sicurezza richiesta dalle specifiche) 
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const sql = 'INSERT INTO utenti (email, password_hash, name, lastName, settings) VALUES (?, ?, ?, ?, ?)';
        const [result] = await db.query(sql, [email, hashedPassword, name, lastName, JSON.stringify({})]);

        // Creazione Token JWT [3, 4]
        const token = jwt.sign({ id: result.insertId, email }, process.env.JWT_SECRET, { expiresIn: '2h' });

        // FONDAMENTALE: Invia l'oggetto user al frontend per evitare il pop-up di errore
        const user = { id: result.insertId, email, name, lastName };

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

        const user = rows;

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

// --- LOGOUT ---
router.post('/logout', (req, res) => {
    res.clearCookie('access_token'); 
    res.json({ message: "Logout effettuato" });
});

module.exports = router;