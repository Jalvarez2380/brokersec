const inspectionRepository = require('../repositories/inspectionRepository');
const { normalizeRole, USER_ROLES } = require('../config/roles');

function canViewAllInspections(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.INSPECTOR].includes(normalizeRole(role));
}

class InspectionController {
  async create(req, res, next) {
    try {
      const { userId, vehicleId, quoteId, status, notes, scheduledAt, evidences, location } = req.body;
      const role = normalizeRole(req.user?.role);
      const resolvedUserId = role === USER_ROLES.ADMIN && userId ? userId : req.user?.sub || userId;

      const inspection = await inspectionRepository.createInspection({
        userId: resolvedUserId,
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
      const role = normalizeRole(req.user?.role);
      const inspections = await inspectionRepository.listInspections({
        userId: canViewAllInspections(role) ? req.query.userId : req.user?.sub,
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

      if (!canViewAllInspections(req.user?.role) && Number(inspection.userId) !== Number(req.user?.sub)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta inspección',
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
