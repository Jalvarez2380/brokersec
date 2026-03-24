const config = require('../config');

const ASSISTANT_INSTRUCTIONS = `
Eres el asistente virtual de BROKERSEC, una app academica de seguros vehiculares.
Responde en espanol claro, breve y util.
Ayuda con registro, inicio de sesion, cotizaciones, inspecciones, vehiculos, polizas y cobertura general.
Si no sabes algo especifico del negocio, dilo con honestidad y ofrece una orientacion general.
No inventes precios, contratos ni estados internos inexistentes.
Cuando el usuario pida pasos, responde con listas cortas y accionables.
`;

function extractOutputText(payload) {
  if (typeof payload.output_text === 'string' && payload.output_text.trim()) {
    return payload.output_text.trim();
  }

  const output = Array.isArray(payload.output) ? payload.output : [];
  const textParts = [];

  for (const item of output) {
    const content = Array.isArray(item.content) ? item.content : [];
    for (const part of content) {
      if (part.type === 'output_text' && part.text) {
        textParts.push(part.text);
      }
    }
  }

  return textParts.join('\n').trim();
}

class OpenAIAssistantService {
  isConfigured() {
    const apiKey = config.openai.apiKey;
    return Boolean(apiKey && apiKey !== 'NO_CONFIGURADA');
  }

  async generateReply({ message, previousResponseId, userContext = {} }) {
    if (!this.isConfigured()) {
      return {
        configured: false,
        response: 'El asistente inteligente todavia no esta configurado. Agrega OPENAI_API_KEY en el backend para activarlo.',
        previousResponseId: null,
      };
    }

    const input = [
      {
        role: 'user',
        content: [
          {
            type: 'input_text',
            text: [
              `Consulta del usuario: ${message}`,
              userContext.username ? `Usuario autenticado: ${userContext.username}` : null,
              userContext.email ? `Email del usuario: ${userContext.email}` : null,
            ].filter(Boolean).join('\n'),
          },
        ],
      },
    ];

    const response = await fetch(`${config.openai.baseUrl}/responses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.openai.apiKey}`,
      },
      body: JSON.stringify({
        model: config.openai.model,
        instructions: ASSISTANT_INSTRUCTIONS.trim(),
        input,
        previous_response_id: previousResponseId || undefined,
        text: {
          verbosity: 'medium',
        },
        max_output_tokens: 300,
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      const message = payload?.error?.message || 'No se pudo generar una respuesta del asistente';
      const error = new Error(message);
      error.statusCode = response.status;
      throw error;
    }

    return {
      configured: true,
      response: extractOutputText(payload) || 'No pude generar una respuesta en este momento.',
      previousResponseId: payload.id || null,
      model: payload.model || config.openai.model,
    };
  }
}

module.exports = new OpenAIAssistantService();
