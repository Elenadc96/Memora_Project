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
app.use(cors({ 
  origin: 'http://localhost:8080', 
  credentials: true // Permette lo scambio di cookie tra frontend e backend 
}));


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser()); // Necessario per leggere l'access_token 
app.use(express.static(path.join(__dirname, 'public')));

// ROTTE DI AUTENTICAZIONE 
app.use('/api/auth', require('./routes/auth')); 

app.use('/api/utenti', verifyToken, require('./routes/users'));
app.use('/api/subject', verifyToken, require('./routes/subject'));
app.use('/api/lessons', verifyToken, require('./routes/lessons'));
app.use('/api/flashcard', verifyToken, require('./routes/flashcards'));
app.use('/api/sessioni', verifyToken, require('./routes/sessioni'));
app.use('/api/badge', verifyToken, require('./routes/badge'));
app.use('/api/points', verifyToken, require('./routes/points'));

// Gestione errori 404 in JSON per le API [User Context]
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trovata' });
});

module.exports = app; 