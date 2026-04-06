const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { USER_ROLES } = require('../config/roles');

const router = express.Router();

router.use(authenticateToken);
router.use(authorizeRoles(USER_ROLES.ADMIN));

router.post('/', userController.create);
router.get('/', userController.list);
router.get('/:id', userController.getById);

module.exports = router;
