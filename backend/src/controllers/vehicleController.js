const vehicleRepository = require('../repositories/vehicleRepository');

class VehicleController {
  async create(req, res, next) {
    try {
      const { brand, model, year, plate, insuredValue, extrasValue, metadata } = req.body;
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

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
      const userId = req.user?.sub;
      const vehicles = await vehicleRepository.listVehicles({
        userId,
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
      if (!vehicle || vehicle.userId !== req.user?.sub) {
        return res.status(404).json({
          success: false,
          message: 'Vehiculo no encontrado',
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
