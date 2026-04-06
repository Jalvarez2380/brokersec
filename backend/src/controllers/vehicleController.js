const vehicleRepository = require('../repositories/vehicleRepository');
const { normalizeRole, USER_ROLES } = require('../config/roles');

function canViewAllVehicles(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.INSPECTOR, USER_ROLES.SALES].includes(normalizeRole(role));
}

class VehicleController {
  async create(req, res, next) {
    try {
      const { userId, brand, model, year, plate, insuredValue, extrasValue, metadata } = req.body;

      if (!brand || !model) {
        return res.status(400).json({
          success: false,
          message: 'brand y model son obligatorios',
        });
      }

      const role = normalizeRole(req.user?.role);
      const resolvedUserId = role === USER_ROLES.ADMIN && userId ? userId : req.user?.sub || userId;

      const vehicle = await vehicleRepository.createVehicle({
        userId: resolvedUserId,
        brand,
        model,
        year,
        plate,
        insuredValue,
        extrasValue,
        metadata,
      });

      return res.status(201).json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const role = normalizeRole(req.user?.role);
      const vehicles = await vehicleRepository.listVehicles({
        userId: canViewAllVehicles(role) ? req.query.userId : req.user?.sub,
      });

      return res.json({
        success: true,
        data: vehicles,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const vehicle = await vehicleRepository.findVehicleById(req.params.id);
      if (!vehicle) {
        return res.status(404).json({
          success: false,
          message: 'Vehículo no encontrado',
        });
      }

      if (!canViewAllVehicles(req.user?.role) && Number(vehicle.userId) !== Number(req.user?.sub)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver este vehículo',
        });
      }

      return res.json({
        success: true,
        data: vehicle,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new VehicleController();
