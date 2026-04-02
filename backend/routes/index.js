const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({ message: 'API Memora Project attiva' });
});

module.exports = router;