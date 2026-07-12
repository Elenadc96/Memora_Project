const express = require('express');
const path = require('path');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const verifyToken = require('./middleware/auth');

const app = express();

// Configurazione database 
require('./config/db');

// CONFIGURAZIONE CORS
// L'origine è configurabile via env perché la porta del frontend cambia se 8080
// è già occupata (vue-cli-service passa automaticamente alla porta libera
// successiva, es. 8081/8082) — con l'origin hardcoded le richieste dirette
// (non passate dal proxy di vue-cli-service) verrebbero bloccate dal browser.
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:8080',
  credentials: true // Permette lo scambio di cookie tra frontend e backend
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Necessario per leggere l'access_token

// Statico per le immagini delle flashcard. I filename sono UUID (128 bit di
// entropia) → non enumerabili, quindi il path pubblico funziona da "capability
// token" implicito senza bisogno di un endpoint proxy autenticato.
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
  maxAge: '7d',
  immutable: true,
}));

// ROTTE DI AUTENTICAZIONE
app.use('/api/auth', require('./routes/auth'));

// /api/status (pubblico, health check) + /api/dashboard e /api/ranking
// (protetti per-rotta dentro il router, perché condividono il mount con status)
app.use('/api', require('./routes/stats'));

// Rotte per risorsa: verifyToken applicato qui al mount, una volta sola —
// tutte le rotte dentro questi router hanno già req.user valorizzato.
app.use('/api/subjects', verifyToken, require('./routes/subjects'));
app.use('/api/lessons', verifyToken, require('./routes/lessons'));
app.use('/api/flashcards', verifyToken, require('./routes/flashcards'));
app.use('/api/sessions', verifyToken, require('./routes/sessions'));
app.use('/api/utenti', verifyToken, require('./routes/users'));
app.use('/api/badge', verifyToken, require('./routes/badge'));

// Gestione errori 404 in JSON per le API [User Context]
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trovata' });
});

module.exports = app; 