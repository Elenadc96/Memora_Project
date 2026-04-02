const express = require('express');
const router = express.Router();
const controller = require('../controllers/pointsControllers');

router.get('/', controller.getAll);
router.post('/', controller.create);
router.put('/:userId', controller.update);
router.delete('/:userId', controller.remove);

module.exports = router;