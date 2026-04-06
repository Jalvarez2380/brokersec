const quoteRepository = require('../repositories/quoteRepository');
const { normalizeRole, USER_ROLES } = require('../config/roles');

function canViewAllQuotes(role) {
  return [USER_ROLES.ADMIN, USER_ROLES.INSPECTOR, USER_ROLES.SALES].includes(normalizeRole(role));
}

class QuoteController {
  async create(req, res, next) {
    try {
      const {
        userId,
        vehicleId,
        city,
        country,
        status,
        coveragePlan,
        insuredValue,
        premiumNet,
        taxes,
        totalPremium,
        payload,
      } = req.body;

      const role = normalizeRole(req.user?.role);
      const resolvedUserId = role === USER_ROLES.ADMIN && userId ? userId : req.user?.sub || userId;

      const quote = await quoteRepository.createQuote({
        userId: resolvedUserId,
        vehicleId,
        city,
        country,
        status,
        coveragePlan,
        insuredValue,
        premiumNet,
        taxes,
        totalPremium,
        payload,
      });

      return res.status(201).json({
        success: true,
        data: quote,
      });
    } catch (error) {
      return next(error);
    }
  }

  async list(req, res, next) {
    try {
      const role = normalizeRole(req.user?.role);
      const quotes = await quoteRepository.listQuotes({
        userId: canViewAllQuotes(role) ? req.query.userId : req.user?.sub,
        vehicleId: req.query.vehicleId,
      });

      return res.json({
        success: true,
        data: quotes,
      });
    } catch (error) {
      return next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const quote = await quoteRepository.findQuoteById(req.params.id);
      if (!quote) {
        return res.status(404).json({
          success: false,
          message: 'Cotización no encontrada',
        });
      }

      if (!canViewAllQuotes(req.user?.role) && Number(quote.userId) !== Number(req.user?.sub)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para ver esta cotización',
        });
      }

      return res.json({
        success: true,
        data: quote,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new QuoteController();
