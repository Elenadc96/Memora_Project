const express = require('express');
const router = express.Router();
const controller = require('../controllers/lessonsController');

router.get('/', controller.getAll);
router.get('/subject/:subjectId', controller.getBySubject);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;