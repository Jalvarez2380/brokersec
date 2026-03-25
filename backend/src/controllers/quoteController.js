const quoteRepository = require('../repositories/quoteRepository');

class QuoteController {
  async create(req, res, next) {
    try {
      const {
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
      const userId = req.user?.sub;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no autenticado',
        });
      }

      const quote = await quoteRepository.createQuote({
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
      const userId = req.user?.sub;
      const quotes = await quoteRepository.listQuotes({
        userId,
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
      if (!quote || quote.userId !== req.user?.sub) {
        return res.status(404).json({
          success: false,
          message: 'Cotizacion no encontrada',
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
