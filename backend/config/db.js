require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10
});
console.log("DB USER:", process.env.DB_USER);
console.log("DB PASSWORD:", process.env.DB_PASSWORD);
console.log("DB PORT:", process.env.DB_PORT);
pool.getConnection().then((connection) => {
  console.log('Connected to MySQL');
}).catch((err) => {
  console.error('Errore connessione MySQL:', err.message);
});

module.exports = pool;