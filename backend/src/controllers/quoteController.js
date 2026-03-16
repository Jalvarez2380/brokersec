const quoteRepository = require('../repositories/quoteRepository');

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
      const quotes = await quoteRepository.listQuotes({
        userId: req.query.userId,
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
