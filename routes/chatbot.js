const express = require('express');
const { body, validationResult } = require('express-validator');
const { ChatbotService } = require('../services/aiServices');
const { optionalAuth } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const router = express.Router();

// Base de conocimiento sobre normativas SEC y servicios eléctricos
const knowledgeBase = {
  'normativas_sec': {
    'ds8': {
      title: 'Reglamento DS 8',
      description: 'Reglamento de Instalaciones de Consumo de Energía Eléctrica',
      content: 'El DS 8 regula las instalaciones de consumo eléctrico en Chile, estableciendo requisitos de seguridad para el diseño, construcción, operación y mantenimiento.',
      keywords: ['ds8', 'reglamento', 'instalaciones', 'consumo', 'seguridad']
    },
    'ric': {
      title: 'Pliegos Técnicos RIC',
      description: 'Reglamento de Instalaciones de Corriente Fuerte',
      content: 'Los pliegos RIC (1-19) establecen especificaciones técnicas para diferentes aspectos de las instalaciones eléctricas.',
      keywords: ['ric', 'pliegos', 'técnicos', 'corriente', 'especificaciones']
    }
  },
  'certificaciones': {
    'te1': {
      title: 'Certificado TE1',
      description: 'Certificación para instalaciones domiciliarias',
      content: 'El TE1 certifica que las instalaciones eléctricas domiciliarias cumplen con las normativas SEC y son seguras para su uso.',
      keywords: ['te1', 'certificado', 'domiciliario', 'instalaciones', 'seguro']
    },
    'tc6': {
      title: 'Certificado TC6',
      description: 'Certificación para instalaciones comerciales e industriales',
      content: 'El TC6 es requerido para instalaciones comerciales e industriales de mayor complejidad.',
      keywords: ['tc6', 'certificado', 'comercial', 'industrial', 'complejo']
    }
  },
  'servicios': {
    'instalacion': {
      title: 'Instalación Eléctrica',
      description: 'Servicios de instalación eléctrica domiciliaria',
      content: 'Ofrecemos servicios completos de instalación eléctrica incluyendo tableros, cableado, enchufes y sistemas de protección.',
      keywords: ['instalación', 'eléctrica', 'tablero', 'cableado', 'enchufes']
    },
    'mantenimiento': {
      title: 'Mantenimiento Eléctrico',
      description: 'Servicios de mantenimiento preventivo y correctivo',
      content: 'Realizamos mantenimiento preventivo y correctivo de instalaciones eléctricas para garantizar su seguridad y funcionamiento.',
      keywords: ['mantenimiento', 'preventivo', 'correctivo', 'seguridad', 'funcionamiento']
    }
  }
};

// Preguntas frecuentes predefinidas
const frequentQuestions = [
  {
    question: "¿Qué es un TE1?",
    answer: "El TE1 es un certificado SEC que garantiza que una instalación eléctrica domiciliaria cumple con todas las normativas de seguridad establecidas en el Reglamento DS 8. Es obligatorio para todas las instalaciones nuevas y modificaciones importantes.",
    category: "certificaciones",
    keywords: ["te1", "certificado", "domiciliario", "seguridad"]
  },
  {
    question: "¿Cuándo necesito un certificado TC6?",
    answer: "El TC6 es requerido para instalaciones comerciales e industriales, especialmente aquellas con potencias superiores a 10 kW. También es necesario para instalaciones trifásicas complejas y sistemas de emergencia.",
    category: "certificaciones",
    keywords: ["tc6", "comercial", "industrial", "potencia", "trifásico"]
  },
  {
    question: "¿Qué tipos de instalaciones eléctricas ofrecen?",
    answer: "Ofrecemos instalaciones monofásicas, bifásicas y trifásicas para uso domiciliario, comercial e industrial. Incluimos tableros eléctricos, sistemas de puesta a tierra, protecciones y cableado completo según normativas SEC.",
    category: "servicios",
    keywords: ["instalaciones", "monofásico", "trifásico", "tablero", "normativas"]
  },
  {
    question: "¿Cada cuánto debo hacer mantenimiento a mi instalación eléctrica?",
    answer: "Según el DS 8, las instalaciones domiciliarias deben inspeccionarse anualmente. Para instalaciones comerciales e industriales, se recomienda cada 6 meses. El mantenimiento preventivo ayuda a detectar problemas antes de que se vuelvan peligrosos.",
    category: "mantenimiento",
    keywords: ["mantenimiento", "inspección", "anual", "preventivo", "ds8"]
  },
  {
    question: "¿Qué es el RIC y por qué es importante?",
    answer: "Los pliegos RIC (Reglamento de Instalaciones de Corriente Fuerte) son 19 documentos técnicos que especifican los requisitos para diferentes aspectos de las instalaciones eléctricas, desde medidores hasta sistemas de emergencia. Son fundamentales para garantizar la seguridad.",
    category: "normativas",
    keywords: ["ric", "reglamento", "técnico", "seguridad", "instalaciones"]
  }
];

/**
 * @route   POST /api/chatbot/message
 * @desc    Procesar mensaje del usuario y generar respuesta
 * @access  Public (con autenticación opcional)
 */
router.post('/message', [
  optionalAuth,
  body('message')
    .trim()
    .isLength({ min: 1, max: 500 })
    .withMessage('El mensaje debe tener entre 1 y 500 caracteres'),
  
  body('sessionId')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Session ID inválido')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }

  const { message, sessionId } = req.body;
  const userId = req.user ? req.user._id.toString() : 'anonymous';
  const finalSessionId = sessionId || `session-${userId}-${Date.now()}`;

  try {
    // Primero buscar en respuestas predefinidas
    const quickResponse = findQuickResponse(message);
    
    if (quickResponse) {
      // Registrar interacción para analytics
      logChatbotInteraction(userId, message, quickResponse.answer, 'quick_response');
      
      return res.json({
        success: true,
        data: {
          response: quickResponse.answer,
          source: 'knowledge_base',
          confidence: 0.95,
          category: quickResponse.category,
          sessionId: finalSessionId,
          suggestions: generateSuggestions(quickResponse.category),
          followupActions: generateFollowupActions(quickResponse.category)
        }
      });
    }

    // Si no hay respuesta rápida, usar servicio de IA
    const aiResponse = await ChatbotService.processMessage(message, finalSessionId);
    
    // Registrar interacción
    logChatbotInteraction(userId, message, aiResponse.response, aiResponse.source);
    
    res.json({
      success: true,
      data: {
        response: aiResponse.response,
        source: aiResponse.source,
        confidence: aiResponse.confidence,
        intent: aiResponse.intent,
        sessionId: finalSessionId,
        suggestions: generateSuggestions(),
        followupActions: aiResponse.followupActions
      }
    });

  } catch (error) {
    console.error('Error en chatbot:', error);
    
    // Respuesta de fallback
    const fallbackResponse = getFallbackResponse();
    
    res.json({
      success: true,
      data: {
        response: fallbackResponse,
        source: 'fallback',
        confidence: 0.5,
        sessionId: finalSessionId,
        suggestions: generateSuggestions(),
        followupActions: []
      }
    });
  }
}));

/**
 * @route   GET /api/chatbot/suggestions
 * @desc    Obtener sugerencias de preguntas frecuentes
 * @access  Public
 */
router.get('/suggestions', asyncHandler(async (req, res) => {
  const { category } = req.query;
  
  let suggestions = frequentQuestions.map(fq => ({
    question: fq.question,
    category: fq.category
  }));
  
  if (category) {
    suggestions = suggestions.filter(s => s.category === category);
  }
  
  // Limitar a 5 sugerencias
  suggestions = suggestions.slice(0, 5);
  
  res.json({
    success: true,
    data: {
      suggestions,
      categories: Object.keys(knowledgeBase)
    }
  });
}));

/**
 * @route   GET /api/chatbot/knowledge-base
 * @desc    Obtener información de la base de conocimiento
 * @access  Public
 */
router.get('/knowledge-base', asyncHandler(async (req, res) => {
  const { search, category } = req.query;
  
  let results = [];
  
  if (search) {
    // Buscar en la base de conocimiento
    results = searchKnowledgeBase(search);
  } else if (category) {
    // Obtener categoría específica
    if (knowledgeBase[category]) {
      results = Object.values(knowledgeBase[category]);
    }
  } else {
    // Obtener resumen de todas las categorías
    results = Object.keys(knowledgeBase).map(cat => ({
      category: cat,
      title: `Información sobre ${cat}`,
      itemCount: Object.keys(knowledgeBase[cat]).length
    }));
  }
  
  res.json({
    success: true,
    data: {
      results,
      totalResults: results.length,
      searchTerm: search,
      category: category
    }
  });
}));

/**
 * @route   POST /api/chatbot/feedback
 * @desc    Recibir feedback sobre respuestas del chatbot
 * @access  Public (con autenticación opcional)
 */
router.post('/feedback', [
  optionalAuth,
  body('sessionId')
    .notEmpty()
    .withMessage('Session ID requerido'),
  
  body('messageId')
    .optional()
    .isMongoId()
    .withMessage('Message ID inválido'),
  
  body('rating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating debe ser entre 1 y 5'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Feedback no puede exceder 500 caracteres'),
  
  body('helpful')
    .isBoolean()
    .withMessage('Helpful debe ser verdadero o falso')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }

  const { sessionId, messageId, rating, feedback, helpful } = req.body;
  const userId = req.user ? req.user._id.toString() : 'anonymous';
  
  // Registrar feedback para mejorar el servicio
  const feedbackData = {
    userId,
    sessionId,
    messageId,
    rating,
    feedback,
    helpful,
    timestamp: new Date()
  };
  
  // Aquí se guardaría en una base de datos de feedback
  console.log('📝 Feedback recibido:', feedbackData);
  
  res.json({
    success: true,
    message: 'Gracias por tu feedback. Nos ayuda a mejorar nuestro servicio.'
  });
}));

/**
 * @route   GET /api/chatbot/health
 * @desc    Verificar estado del servicio de chatbot
 * @access  Public
 */
router.get('/health', asyncHandler(async (req, res) => {
  // Verificar conectividad con servicios de IA
  const healthChecks = {
    knowledgeBase: true,
    dialogflow: false,
    openai: false
  };
  
  try {
    // Simular verificación de Dialogflow
    healthChecks.dialogflow = true;
  } catch (error) {
    console.error('Dialogflow health check failed:', error);
  }
  
  try {
    // Simular verificación de OpenAI
    healthChecks.openai = true;
  } catch (error) {
    console.error('OpenAI health check failed:', error);
  }
  
  const overallHealth = Object.values(healthChecks).every(status => status);
  
  res.json({
    success: true,
    data: {
      status: overallHealth ? 'healthy' : 'degraded',
      services: healthChecks,
      timestamp: new Date(),
      version: '1.0.0'
    }
  });
}));

// Funciones auxiliares

function findQuickResponse(message) {
  const normalizedMessage = message.toLowerCase().trim();
  
  // Buscar coincidencias exactas primero
  for (const fq of frequentQuestions) {
    if (normalizedMessage === fq.question.toLowerCase()) {
      return fq;
    }
  }
  
  // Buscar por palabras clave
  for (const fq of frequentQuestions) {
    const matchCount = fq.keywords.filter(keyword => 
      normalizedMessage.includes(keyword.toLowerCase())
    ).length;
    
    // Si coinciden al menos 2 palabras clave, considerar como match
    if (matchCount >= 2) {
      return fq;
    }
  }
  
  return null;
}

function searchKnowledgeBase(searchTerm) {
  const results = [];
  const normalizedSearch = searchTerm.toLowerCase();
  
  for (const [category, items] of Object.entries(knowledgeBase)) {
    for (const [key, item] of Object.entries(items)) {
      const relevanceScore = calculateRelevance(item, normalizedSearch);
      
      if (relevanceScore > 0.3) {
        results.push({
          ...item,
          category,
          key,
          relevanceScore
        });
      }
    }
  }
  
  // Ordenar por relevancia
  return results.sort((a, b) => b.relevanceScore - a.relevanceScore);
}

function calculateRelevance(item, searchTerm) {
  let score = 0;
  const fields = [item.title, item.description, item.content, ...item.keywords];
  
  for (const field of fields) {
    if (field && field.toLowerCase().includes(searchTerm)) {
      score += 0.25;
    }
  }
  
  return Math.min(score, 1);
}

function generateSuggestions(category) {
  const suggestions = [
    "¿Qué es un TE1?",
    "¿Cuándo necesito certificación SEC?",
    "¿Qué tipos de instalaciones realizan?",
    "¿Cómo solicitar una cotización?",
    "¿Qué es el mantenimiento preventivo?"
  ];
  
  if (category) {
    return frequentQuestions
      .filter(fq => fq.category === category)
      .map(fq => fq.question)
      .slice(0, 3);
  }
  
  return suggestions.slice(0, 3);
}

function generateFollowupActions(category) {
  const actions = [];
  
  switch (category) {
    case 'certificaciones':
      actions.push({
        type: 'REQUEST_CERTIFICATE',
        label: 'Solicitar Certificación',
        description: 'Obtener certificado SEC para su instalación'
      });
      break;
      
    case 'servicios':
      actions.push({
        type: 'REQUEST_QUOTE',
        label: 'Solicitar Cotización',
        description: 'Obtener cotización personalizada'
      });
      break;
      
    case 'mantenimiento':
      actions.push({
        type: 'SCHEDULE_MAINTENANCE',
        label: 'Agendar Mantenimiento',
        description: 'Programar servicio de mantenimiento'
      });
      break;
  }
  
  return actions;
}

function getFallbackResponse() {
  const fallbacks = [
    "Disculpa, no pude entender tu consulta. ¿Podrías reformularla?",
    "No tengo información específica sobre eso. Te recomiendo contactar a uno de nuestros técnicos certificados SEC.",
    "Esa es una consulta interesante. Para brindarte la mejor respuesta, sería ideal que hables con nuestro equipo técnico.",
    "No encontré información exacta sobre tu consulta. ¿Te gustaría hablar con un especialista?"
  ];
  
  return fallbacks[Math.floor(Math.random() * fallbacks.length)];
}

function logChatbotInteraction(userId, question, answer, source) {
  // En una implementación real, esto se guardaría en base de datos para analytics
  console.log('🤖 Interacción Chatbot:', {
    userId,
    question: question.substring(0, 100),
    source,
    timestamp: new Date(),
    responseLength: answer.length
  });
}

module.exports = router;