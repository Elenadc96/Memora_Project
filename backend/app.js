var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var subjectRouter = require('./routes/subject');
var lessonsRouter = require('./routes/lessons');
var flashcardRouter = require('./routes/flashcards');
var sessioniRouter = require('./routes/sessioni');
var badgeRouter = require('./routes/badge');
var pointsRouter = require('./routes/points');

var app = express();

require('./config/db');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

app.use('/api/users', usersRouter);
app.use('/api/subject', subjectRouter);
app.use('/api/lessons', lessonsRouter);
app.use('/api/flashcard', flashcardRouter);
app.use('/api/sessioni', sessioniRouter);
app.use('/api/badge', badgeRouter);
app.use('/api/points', pointsRouter);

app.use(function(req, res, next) {
  next(createError(404));
});

app.use(function(err, req, res, next) {
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

var port = process.env.PORT || 3000;
app.listen(port, function() {
  console.log('Server avviato su porta ' + port);
});