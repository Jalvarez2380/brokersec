const express = require('express');
const userController = require('../controllers/userController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');
const { USER_ROLES } = require('../config/roles');

const router = express.Router();

router.use(authenticateToken);

router.post('/', authorizeRoles(USER_ROLES.ADMIN), userController.create);
router.get('/', authorizeRoles(USER_ROLES.ADMIN), userController.list);
router.get('/:id', authorizeRoles(USER_ROLES.ADMIN), userController.getById);

module.exports = router;
