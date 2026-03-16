const vehicleRepository = require('../repositories/vehicleRepository');

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

      const vehicle = await vehicleRepository.createVehicle({
        userId,
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
      const vehicles = await vehicleRepository.listVehicles({
        userId: req.query.userId,
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
