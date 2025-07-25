const express = require('express');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const { SpeechToTextService } = require('../services/aiServices');
const { authMiddleware, requireUserType } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const Quotation = require('../models/Quotation');
const router = express.Router();

// Configuración de multer para archivos de audio
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB máximo
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Tipos de archivo de audio permitidos
    const allowedMimes = [
      'audio/wav',
      'audio/mp3',
      'audio/mpeg',
      'audio/webm',
      'audio/ogg',
      'audio/flac',
      'audio/x-wav',
      'audio/x-m4a'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no soportado. Use WAV, MP3, WebM, OGG o FLAC'), false);
    }
  }
});

/**
 * @route   POST /api/speech/transcribe
 * @desc    Transcribir audio a texto
 * @access  Private
 */
router.post('/transcribe', [
  authMiddleware,
  upload.single('audio'),
  body('encoding')
    .optional()
    .isIn(['LINEAR16', 'FLAC', 'MULAW', 'AMR', 'AMR_WB', 'OGG_OPUS', 'SPEEX_WITH_HEADER_BYTE', 'WEBM_OPUS', 'MP3'])
    .withMessage('Codificación de audio no soportada'),
  
  body('sampleRate')
    .optional()
    .isInt({ min: 8000, max: 48000 })
    .withMessage('Frecuencia de muestreo debe estar entre 8000 y 48000 Hz'),
  
  body('language')
    .optional()
    .isIn(['es-CL', 'es-ES', 'es-MX'])
    .withMessage('Idioma no soportado')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }

  if (!req.file) {
    throw createError('Archivo de audio requerido', 400);
  }

  const { encoding = 'WEBM_OPUS', sampleRate = 48000, language = 'es-CL' } = req.body;

  try {
    // Transcribir audio usando Google Speech-to-Text
    const transcriptionResult = await SpeechToTextService.transcribeAudio(
      req.file.buffer,
      encoding,
      parseInt(sampleRate)
    );

    // Registrar la transcripción para analytics
    console.log('🎤 Transcripción completada:', {
      userId: req.user._id,
      confidence: transcriptionResult.confidence,
      requirementType: transcriptionResult.requirementType,
      textLength: transcriptionResult.transcript.length
    });

    res.json({
      success: true,
      data: {
        transcript: transcriptionResult.transcript,
        confidence: transcriptionResult.confidence,
        requirementType: transcriptionResult.requirementType,
        detectedLanguage: transcriptionResult.detectedLanguage,
        wordCount: transcriptionResult.transcript.split(' ').length,
        processingTime: Date.now() - req.startTime
      }
    });

  } catch (error) {
    console.error('Error en transcripción:', error);
    throw createError('Error al procesar el audio', 500);
  }
}));

/**
 * @route   POST /api/speech/process-requirement
 * @desc    Procesar requerimiento por voz y generar cotización preliminar
 * @access  Private
 */
router.post('/process-requirement', [
  authMiddleware,
  upload.single('audio'),
  body('requirementDetails')
    .optional()
    .isJSON()
    .withMessage('Detalles del requerimiento deben estar en formato JSON'),
  
  body('autoGenerateQuote')
    .optional()
    .isBoolean()
    .withMessage('autoGenerateQuote debe ser verdadero o falso')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }

  if (!req.file) {
    throw createError('Archivo de audio requerido', 400);
  }

  const { requirementDetails, autoGenerateQuote = false } = req.body;

  try {
    // 1. Transcribir el audio
    const transcriptionResult = await SpeechToTextService.transcribeAudio(req.file.buffer);
    
    // 2. Procesar el texto para extraer información estructurada
    const processedRequirement = processRequirementText(
      transcriptionResult.transcript,
      transcriptionResult.requirementType,
      requirementDetails ? JSON.parse(requirementDetails) : {}
    );

    // 3. Si está habilitado, generar cotización automática
    let quotation = null;
    if (autoGenerateQuote) {
      quotation = await generatePreliminaryQuotation(req.user._id, processedRequirement);
    }

    // 4. Respuesta estructurada
    const response = {
      transcription: {
        text: transcriptionResult.transcript,
        confidence: transcriptionResult.confidence,
        detectedType: transcriptionResult.requirementType
      },
      processedRequirement: processedRequirement,
      suggestions: generateRequirementSuggestions(processedRequirement),
      nextSteps: generateNextSteps(processedRequirement, req.user.userType)
    };

    if (quotation) {
      response.preliminaryQuotation = {
        quotationNumber: quotation.quotationNumber,
        estimatedCost: quotation.costs.total,
        estimatedTime: quotation.estimatedTime.total,
        validUntil: quotation.validUntil
      };
    }

    res.json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error procesando requerimiento por voz:', error);
    throw createError('Error al procesar el requerimiento', 500);
  }
}));

/**
 * @route   GET /api/speech/supported-formats
 * @desc    Obtener formatos de audio soportados
 * @access  Private
 */
router.get('/supported-formats', authMiddleware, asyncHandler(async (req, res) => {
  const supportedFormats = {
    audio: {
      mimeTypes: [
        'audio/wav',
        'audio/mp3',
        'audio/mpeg',
        'audio/webm',
        'audio/ogg',
        'audio/flac'
      ],
      encodings: [
        'LINEAR16',
        'FLAC',
        'MULAW',
        'AMR',
        'AMR_WB',
        'OGG_OPUS',
        'SPEEX_WITH_HEADER_BYTE',
        'WEBM_OPUS',
        'MP3'
      ],
      maxFileSize: '10MB',
      sampleRateRange: {
        min: 8000,
        max: 48000,
        recommended: 16000
      }
    },
    languages: [
      { code: 'es-CL', name: 'Español (Chile)', primary: true },
      { code: 'es-ES', name: 'Español (España)', primary: false },
      { code: 'es-MX', name: 'Español (México)', primary: false }
    ],
    features: [
      'Transcripción automática',
      'Clasificación de requerimientos',
      'Detección de palabras clave técnicas',
      'Generación de cotizaciones preliminares',
      'Procesamiento en tiempo real'
    ]
  };

  res.json({
    success: true,
    data: supportedFormats
  });
}));

/**
 * @route   POST /api/speech/batch-process
 * @desc    Procesar múltiples archivos de audio (para técnicos)
 * @access  Private (solo técnicos)
 */
router.post('/batch-process', [
  authMiddleware,
  requireUserType('tecnico', 'admin'),
  upload.array('audioFiles', 5), // Máximo 5 archivos
  body('processType')
    .isIn(['transcription', 'requirement_analysis', 'voice_notes'])
    .withMessage('Tipo de procesamiento inválido')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }

  if (!req.files || req.files.length === 0) {
    throw createError('Al menos un archivo de audio es requerido', 400);
  }

  const { processType } = req.body;
  const results = [];

  try {
    // Procesar cada archivo secuencialmente
    for (const [index, file] of req.files.entries()) {
      try {
        const transcriptionResult = await SpeechToTextService.transcribeAudio(file.buffer);
        
        let processedData = {
          fileIndex: index,
          fileName: file.originalname,
          fileSize: file.size,
          transcript: transcriptionResult.transcript,
          confidence: transcriptionResult.confidence
        };

        // Procesamiento específico según el tipo
        switch (processType) {
          case 'requirement_analysis':
            processedData.requirementAnalysis = processRequirementText(
              transcriptionResult.transcript,
              transcriptionResult.requirementType
            );
            break;
            
          case 'voice_notes':
            processedData.summary = generateVoiceNoteSummary(transcriptionResult.transcript);
            break;
            
          default:
            // Solo transcripción
            break;
        }

        results.push({
          success: true,
          data: processedData
        });

      } catch (fileError) {
        results.push({
          success: false,
          fileIndex: index,
          fileName: file.originalname,
          error: fileError.message
        });
      }
    }

    // Estadísticas del lote
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    res.json({
      success: true,
      data: {
        results,
        statistics: {
          totalFiles: req.files.length,
          successfullyProcessed: successCount,
          failed: failureCount,
          processingTime: Date.now() - req.startTime
        }
      }
    });

  } catch (error) {
    console.error('Error en procesamiento por lotes:', error);
    throw createError('Error al procesar archivos de audio', 500);
  }
}));

// Funciones auxiliares

function processRequirementText(transcript, detectedType, additionalDetails = {}) {
  const normalizedText = transcript.toLowerCase();
  
  // Extraer información específica del texto
  const extractedInfo = {
    serviceType: detectedType || 'General',
    urgency: extractUrgency(normalizedText),
    location: extractLocation(normalizedText),
    components: extractComponents(normalizedText),
    electricalSpecs: extractElectricalSpecs(normalizedText),
    timeframe: extractTimeframe(normalizedText),
    budget: extractBudget(normalizedText),
    additionalNotes: transcript
  };

  // Combinar con detalles adicionales si se proporcionan
  return { ...extractedInfo, ...additionalDetails };
}

function extractUrgency(text) {
  const urgencyKeywords = {
    'alta': ['urgente', 'inmediato', 'ahora', 'ya', 'emergencia', 'rápido'],
    'media': ['pronto', 'en unos días', 'esta semana', 'próximamente'],
    'baja': ['cuando puedan', 'sin apuro', 'en el futuro', 'más adelante']
  };

  for (const [level, keywords] of Object.entries(urgencyKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return level;
    }
  }

  return 'media'; // Por defecto
}

function extractLocation(text) {
  // Buscar menciones de ubicación
  const locationPatterns = [
    /en\s+([a-záéíóúñ\s]+(?:santiago|valparaíso|concepción|antofagasta|viña|providencia|las condes|maipú|san miguel))/i,
    /dirección\s+([a-záéíóúñ0-9\s,]+)/i,
    /ubicado\s+en\s+([a-záéíóúñ\s]+)/i
  ];

  for (const pattern of locationPatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function extractComponents(text) {
  const componentKeywords = {
    'Tablero Eléctrico': ['tablero', 'panel eléctrico', 'caja de luz'],
    'Cableado': ['cables', 'cableado', 'alambres', 'instalación eléctrica'],
    'Enchufes': ['enchufes', 'tomacorrientes', 'tomas'],
    'Interruptores': ['interruptores', 'switches', 'apagadores'],
    'Medidor': ['medidor', 'contador de luz'],
    'Sistema de Puesta a Tierra': ['puesta a tierra', 'tierra', 'descarga'],
    'Protecciones': ['protecciones', 'fusibles', 'breakers', 'automáticos']
  };

  const detectedComponents = [];

  for (const [component, keywords] of Object.entries(componentKeywords)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      detectedComponents.push(component);
    }
  }

  return detectedComponents;
}

function extractElectricalSpecs(text) {
  const specs = {};

  // Buscar voltaje
  const voltageMatch = text.match(/(\d+)\s*v|(\d+)\s*volt/i);
  if (voltageMatch) {
    specs.voltage = parseInt(voltageMatch[1] || voltageMatch[2]);
  }

  // Buscar tipo de conexión
  if (text.includes('monofásic')) specs.connectionType = 'Monofásico';
  if (text.includes('bifásic')) specs.connectionType = 'Bifásico';
  if (text.includes('trifásic')) specs.connectionType = 'Trifásico';

  // Buscar potencia
  const powerMatch = text.match(/(\d+)\s*kw|(\d+)\s*kilowatt/i);
  if (powerMatch) {
    specs.power = parseInt(powerMatch[1] || powerMatch[2]);
  }

  return Object.keys(specs).length > 0 ? specs : null;
}

function extractTimeframe(text) {
  const timeframePatterns = {
    'inmediato': ['hoy', 'ahora', 'inmediatamente', 'urgente'],
    '1-3 días': ['mañana', 'pasado mañana', 'esta semana'],
    '1 semana': ['próxima semana', 'en una semana'],
    '2-4 semanas': ['este mes', 'en unas semanas'],
    'flexible': ['cuando puedan', 'sin apuro', 'en el futuro']
  };

  for (const [timeframe, keywords] of Object.entries(timeframePatterns)) {
    if (keywords.some(keyword => text.includes(keyword))) {
      return timeframe;
    }
  }

  return '1 semana'; // Por defecto
}

function extractBudget(text) {
  // Buscar menciones de presupuesto
  const budgetMatch = text.match(/presupuesto\s+de\s+(\d+)|hasta\s+(\d+)|máximo\s+(\d+)/i);
  if (budgetMatch) {
    return parseInt(budgetMatch[1] || budgetMatch[2] || budgetMatch[3]);
  }

  return null;
}

async function generatePreliminaryQuotation(clientId, processedRequirement) {
  try {
    // Generar número de cotización
    const quotationNumber = await Quotation.generateQuotationNumber();

    // Determinar categoría de instalación basada en componentes
    let installationCategory = 'Domiciliaria Simple';
    if (processedRequirement.electricalSpecs?.power > 10) {
      installationCategory = 'Comercial Menor';
    }
    if (processedRequirement.electricalSpecs?.connectionType === 'Trifásico') {
      installationCategory = 'Domiciliaria Compleja';
    }

    // Crear cotización preliminar
    const quotationData = {
      client: clientId,
      quotationNumber,
      serviceType: processedRequirement.serviceType,
      installationCategory,
      connectionType: processedRequirement.electricalSpecs?.connectionType || 'Monofásico',
      voltage: processedRequirement.electricalSpecs?.voltage || 220,
      installationDetails: {
        location: {
          address: processedRequirement.location || 'Por especificar'
        },
        components: processedRequirement.components.map(comp => ({
          type: comp,
          quantity: 1,
          specifications: 'Por especificar según inspección técnica'
        }))
      },
      notes: {
        client: processedRequirement.additionalNotes,
        technical: 'Cotización generada automáticamente desde requerimiento por voz'
      },
      createdBy: clientId,
      status: 'Borrador'
    };

    const quotation = new Quotation(quotationData);
    
    // Calcular costos automáticamente
    quotation.calculateCosts();
    
    await quotation.save();

    return quotation;

  } catch (error) {
    console.error('Error generando cotización preliminar:', error);
    throw error;
  }
}

function generateRequirementSuggestions(processedRequirement) {
  const suggestions = [];

  // Sugerencias basadas en el tipo de servicio
  switch (processedRequirement.serviceType) {
    case 'Instalación Nueva':
      suggestions.push(
        'Considere solicitar un diagnóstico previo del sitio',
        'Verifique permisos municipales necesarios',
        'Solicite certificación TE1 para instalaciones domiciliarias'
      );
      break;
      
    case 'Reparación':
      suggestions.push(
        'Documente el problema con fotos si es posible',
        'Evite manipular instalaciones eléctricas',
        'Considere un mantenimiento preventivo posterior'
      );
      break;
      
    case 'Mantenimiento':
      suggestions.push(
        'Programe mantenimiento durante horarios de menor uso',
        'Prepare acceso a tableros y componentes eléctricos',
        'Considere actualizar componentes obsoletos'
      );
      break;
  }

  // Sugerencias basadas en urgencia
  if (processedRequirement.urgency === 'alta') {
    suggestions.push('Servicio de emergencia disponible 24/7');
  }

  return suggestions;
}

function generateNextSteps(processedRequirement, userType) {
  const steps = [];

  if (userType === 'cliente') {
    steps.push(
      'Revisar cotización preliminar generada',
      'Agendar visita técnica para evaluación detallada',
      'Preparar documentación necesaria (planos, permisos)'
    );
  } else if (userType === 'tecnico') {
    steps.push(
      'Validar información técnica proporcionada',
      'Programar inspección en sitio',
      'Preparar herramientas y equipos necesarios'
    );
  }

  if (processedRequirement.urgency === 'alta') {
    steps.unshift('Contactar para servicio de emergencia');
  }

  return steps;
}

function generateVoiceNoteSummary(transcript) {
  // Generar resumen básico de nota de voz
  const sentences = transcript.split(/[.!?]+/).filter(s => s.trim());
  const wordCount = transcript.split(' ').length;
  
  return {
    summary: sentences.length > 2 ? sentences.slice(0, 2).join('. ') + '.' : transcript,
    wordCount,
    keyTopics: extractComponents(transcript.toLowerCase()),
    duration: Math.ceil(wordCount / 150) // Estimación: ~150 palabras por minuto
  };
}

// Middleware para agregar timestamp de inicio
router.use((req, res, next) => {
  req.startTime = Date.now();
  next();
});

module.exports = router;