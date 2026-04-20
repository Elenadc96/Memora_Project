var express = require('express');
var cors = require('cors');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var app = express();

require('./config/db');

// Middleware
app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Route base
app.get('/', (req, res) => {
  res.json({ message: 'API Memora Project attiva!' });
});

// Tutte le tue API
app.use('/api/utenti', require('./routes/users'));
app.use('/api/subject', require('./routes/subject'));
app.use('/api/lessons', require('./routes/lessons'));
app.use('/api/flashcard', require('./routes/flashcards'));
app.use('/api/sessioni', require('./routes/sessioni'));
app.use('/api/badge', require('./routes/badge'));
app.use('/api/points', require('./routes/points'));

// 404 handler JSON
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route non trovata' });
});

const port = 3000;
app.listen(port, () => {
  console.log('Server su http://localhost:' + port);
});