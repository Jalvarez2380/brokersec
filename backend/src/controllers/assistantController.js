const openaiAssistantService = require('../services/openaiAssistantService');

class AssistantController {
  async chat(req, res, next) {
    try {
      const { message, previousResponseId } = req.body || {};

      if (!message || !String(message).trim()) {
        return res.status(400).json({
          success: false,
          message: 'El mensaje es obligatorio',
        });
      }

      const result = await openaiAssistantService.generateReply({
        message: String(message).trim(),
        previousResponseId,
        userContext: req.user || {},
      });

      return res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      return next(error);
    }
  }
}

module.exports = new AssistantController();
