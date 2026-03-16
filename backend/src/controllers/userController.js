const userRepository = require('../repositories/userRepository');
const authController = require('./authController');

class UserController {
  async create(req, res, next) {
    return authController.signup(req, res, next);
  }

  async list(req, res, next) {
    try {
      const users = await userRepository.listUsers();
      return res.json({
        success: true,
        data: users,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const user = await userRepository.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      return res.json({
        success: true,
        data: userRepository.mapUser(user),
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new UserController();
