const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const userRepository = require('../repositories/userRepository');
const { normalizeRole, USER_ROLES } = require('../config/roles');

function normalizeSignupBody(body = {}) {
  return {
    dni: body.dni || body.cedula,
    firstName: body.firstName || body.nombre,
    lastName: body.lastName || body.apellido,
    email: body.email,
    username: body.username || body.usuario,
    password: body.password,
    mobile: body.mobile || body.telefono,
    role: body.role,
  };
}

function buildUserResponse(userRow, token) {
  const user = userRepository.mapUser(userRow);

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`.trim(),
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    dni: user.dni,
    mobile: user.mobile,
    token,
  };
}

class AuthController {
  async signup(req, res, next) {
    try {
      const payload = normalizeSignupBody(req.body);
      const { dni, firstName, lastName, email, username, password, mobile, role } = payload;

      if (!dni || !firstName || !lastName || !email || !username || !password) {
        return res.status(400).json({
          success: false,
          message: 'dni, firstName, lastName, email, username y password son obligatorios',
        });
      }

      const existingByUsername = await userRepository.findByUsernameOrEmail(username);
      const existingByEmail = existingByUsername ? existingByUsername : await userRepository.findByUsernameOrEmail(email);
      const existingByDni = existingByEmail ? existingByEmail : await userRepository.findByUsernameOrEmail(dni);

      if (existingByDni) {
        return res.status(409).json({
          success: false,
          message: 'La cédula, el usuario o el correo ya están registrados',
        });
      }

      const passwordHash = await bcrypt.hash(password, config.bcrypt.saltRounds);
      const normalizedRequestedRole = normalizeRole(role);
      const requestedRole = req.user && normalizeRole(req.user.role) === USER_ROLES.ADMIN
        ? normalizedRequestedRole
        : [USER_ROLES.USER, USER_ROLES.INSPECTOR, USER_ROLES.SALES].includes(normalizedRequestedRole)
          ? normalizedRequestedRole
          : USER_ROLES.USER;

      const user = await userRepository.createUser({
        dni,
        firstName,
        lastName,
        email,
        username,
        passwordHash,
        mobile,
        role: requestedRole,
      });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado correctamente',
        ...buildUserResponse(user),
      });
    } catch (error) {
      return next(error);
    }
  }

  async signin(req, res, next) {
    try {
      const usernameOrEmail = req.body.username || req.body.email;
      const { password } = req.body;

      if (!usernameOrEmail || !password) {
        return res.status(400).json({
          success: false,
          message: 'username/email y password son obligatorios',
        });
      }

      const user = await userRepository.findByUsernameOrEmail(usernameOrEmail);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas',
        });
      }

      const token = jwt.sign(
        {
          sub: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
        },
        config.jwt.secret,
        { expiresIn: config.jwt.expiresIn }
      );

      return res.json({
        success: true,
        message: 'Autenticación exitosa',
        ...buildUserResponse(user, token),
      });
    } catch (error) {
      return next(error);
    }
  }

  async signout(req, res) {
    return res.json({
      success: true,
      message: 'Sesión cerrada correctamente',
    });
  }

  async getCurrentUser(req, res, next) {
    try {
      const user = await userRepository.findById(req.user.sub);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado',
        });
      }

      return res.json({
        ...buildUserResponse(user),
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AuthController();
