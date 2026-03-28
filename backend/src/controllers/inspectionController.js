const inspectionRepository = require('../repositories/inspectionRepository');

class InspectionController {
  async create(req, res, next) {
    try {
      const { userId, vehicleId, quoteId, status, notes, scheduledAt, location, evidences } = req.body;

      const inspection = await inspectionRepository.createInspection({
        userId,
        vehicleId,
        quoteId,
        status,
        notes,
        scheduledAt,
        location,
        evidences: Array.isArray(evidences) ? evidences : [],
      });

      return res.status(201).json({
        success: true,
        data: inspection,
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const inspections = await inspectionRepository.listInspections({
        userId: req.query.userId,
        vehicleId: req.query.vehicleId,
        quoteId: req.query.quoteId,
      });

      return res.json({
        success: true,
        data: inspections,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const inspection = await inspectionRepository.findInspectionById(req.params.id);
      if (!inspection) {
        return res.status(404).json({
          success: false,
          message: 'Inspección no encontrada',
        });
      }

      return res.json({
        success: true,
        data: inspection,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new InspectionController();
