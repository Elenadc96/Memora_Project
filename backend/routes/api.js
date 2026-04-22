const express = require('express');
const router = express.Router();
const db = require('../config/db');

router.get('/status', async (req, res) => {
  try {
    await db.promise().query('SELECT 1');
    res.json({ status: 'ok', message: 'Backend operativo', timestamp: new Date() });
  } catch (err) {
    res.status(500).json({ status: 'error', message: 'Database non raggiungibile' });
  }
});

module.exports = router;
