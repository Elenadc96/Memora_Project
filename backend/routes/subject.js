const express = require('express');
const router = express.Router();
const controller = require('../controllers/subjectControllers');

router.get('/', controller.getAll);
router.get('/user/:userId', controller.getByUser);
router.post('/', controller.create);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);

module.exports = router;