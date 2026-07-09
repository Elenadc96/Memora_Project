const express = require('express');
const cors = require('cors');
const path = require('path');
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
app.use(express.static(path.join(__dirname, 'public')));

// ROTTE DI AUTENTICAZIONE
app.use('/api/auth', require('./routes/auth'));

// ROTTE API PRINCIPALI (subjects, lessons, flashcards)
app.use('/api', require('./routes/api'));

app.use('/api/utenti', verifyToken, require('./routes/users'));
app.use('/api/badge', verifyToken, require('./routes/badge'));

// Gestione errori 404 in JSON per le API [User Context]
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trovata' });
});

module.exports = app; 