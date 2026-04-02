const mysql = require('mysql2');

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: 'Aquila.45',
  database: 'memora_project'
});

connection.connect((err) => {
  if (err) {
    console.error('Errore connessione MySQL:', err.message);
    return;
  }
  console.log('Connected to MySQL');
});

module.exports = connection;