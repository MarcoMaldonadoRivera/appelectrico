const speech = require('@google-cloud/speech');
const { SessionsClient } = require('@google-cloud/dialogflow');
const OpenAI = require('openai');
const { createExternalAPIError } = require('../middleware/errorHandler');

// Configuración de clientes de IA
const speechClient = new speech.SpeechClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const dialogflowClient = new SessionsClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Servicio de conversión de voz a texto (Speech-to-Text)
 */
class SpeechToTextService {
  /**
   * Convierte audio a texto en español chileno
   * @param {Buffer} audioBuffer - Buffer del archivo de audio
   * @param {string} encoding - Codificación del audio (webm, mp3, wav, etc.)
   * @param {number} sampleRateHertz - Frecuencia de muestreo
   * @returns {Promise<Object>} - Resultado con texto transcrito
   */
  static async transcribeAudio(audioBuffer, encoding = 'WEBM_OPUS', sampleRateHertz = 48000) {
    try {
      const request = {
        audio: {
          content: audioBuffer.toString('base64')
        },
        config: {
          encoding: encoding,
          sampleRateHertz: sampleRateHertz,
          languageCode: 'es-CL', // Español chileno
          alternativeLanguageCodes: ['es-ES', 'es-MX'], // Alternativas
          enableAutomaticPunctuation: true,
          enableWordTimeOffsets: true,
          model: 'latest_long', // Modelo optimizado para audio largo
          useEnhanced: true,
          // Vocabulario específico para términos eléctricos
          speechContexts: [{
            phrases: [
              'tablero eléctrico', 'interruptor automático', 'diferencial',
              'empalme', 'medidor', 'puesta a tierra', 'RIC', 'SEC',
              'instalación eléctrica', 'monofásico', 'trifásico', 'bifásico',
              'voltaje', 'amperaje', 'protección', 'certificación',
              'TE1', 'TC6', 'normativa', 'diagnóstico', 'mantenimiento',
              'cortocircuito', 'sobrecarga', 'enchufes', 'tomacorrientes'
            ]
          }]
        }
      };

      const [response] = await speechClient.recognize(request);
      
      if (!response.results || response.results.length === 0) {
        throw createExternalAPIError('Google Speech', 'No se pudo transcribir el audio', 400);
      }

      const transcription = response.results
        .map(result => result.alternatives[0].transcript)
        .join(' ');

      const confidence = response.results.length > 0 
        ? response.results[0].alternatives[0].confidence 
        : 0;

      // Clasificar el tipo de requerimiento basado en palabras clave
      const requirementType = this.classifyRequirement(transcription);

      return {
        transcript: transcription,
        confidence: confidence,
        requirementType: requirementType,
        wordTimeOffsets: response.results[0]?.alternatives[0]?.words || [],
        detectedLanguage: 'es-CL'
      };

    } catch (error) {
      console.error('Error en Speech-to-Text:', error);
      throw createExternalAPIError('Google Speech', error.message || 'Error al procesar audio');
    }
  }

  /**
   * Clasifica el tipo de requerimiento basado en el texto transcrito
   * @param {string} text - Texto transcrito
   * @returns {string} - Tipo de requerimiento clasificado
   */
  static classifyRequirement(text) {
    const normalizedText = text.toLowerCase();
    
    const patterns = {
      'Instalación Nueva': [
        'instalar', 'instalación nueva', 'nueva instalación', 'necesito instalar',
        'poner tablero', 'instalar tablero', 'conexión nueva'
      ],
      'Reparación': [
        'reparar', 'arreglar', 'no funciona', 'está malo', 'se dañó',
        'problema con', 'falla', 'cortocircuito'
      ],
      'Mantenimiento': [
        'mantenimiento', 'revisión', 'chequear', 'inspeccionar',
        'verificar', 'revisar estado'
      ],
      'Certificación': [
        'certificar', 'certificación', 'TE1', 'TC6', 'sello verde',
        'certificado SEC', 'legalizar'
      ],
      'Diagnóstico': [
        'diagnóstico', 'evaluar', 'cotizar', 'presupuesto',
        'cuánto cuesta', 'precio'
      ]
    };

    for (const [type, keywords] of Object.entries(patterns)) {
      if (keywords.some(keyword => normalizedText.includes(keyword))) {
        return type;
      }
    }

    return 'General';
  }
}

/**
 * Servicio de Chatbot con Dialogflow
 */
class ChatbotService {
  /**
   * Procesa una consulta de usuario y genera respuesta
   * @param {string} message - Mensaje del usuario
   * @param {string} sessionId - ID de sesión único
   * @param {string} languageCode - Código de idioma (default: es)
   * @returns {Promise<Object>} - Respuesta del chatbot
   */
  static async processMessage(message, sessionId, languageCode = 'es') {
    try {
      const sessionPath = dialogflowClient.projectAgentSessionPath(
        process.env.GOOGLE_CLOUD_PROJECT_ID,
        sessionId
      );

      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: message,
            languageCode: languageCode
          }
        }
      };

      const [response] = await dialogflowClient.detectIntent(request);
      const result = response.queryResult;

      // Si Dialogflow no tiene una respuesta específica, usar GPT-4 como fallback
      if (result.intentDetectionConfidence < 0.7) {
        const gptResponse = await this.getGPTResponse(message);
        return {
          response: gptResponse,
          intent: 'fallback.gpt',
          confidence: 0.8,
          source: 'OpenAI GPT-4',
          parameters: {},
          followupActions: []
        };
      }

      return {
        response: result.fulfillmentText,
        intent: result.intent.displayName,
        confidence: result.intentDetectionConfidence,
        source: 'Dialogflow',
        parameters: result.parameters,
        followupActions: this.extractFollowupActions(result)
      };

    } catch (error) {
      console.error('Error en Chatbot:', error);
      
      // Fallback a GPT-4 en caso de error
      try {
        const gptResponse = await this.getGPTResponse(message);
        return {
          response: gptResponse,
          intent: 'fallback.gpt',
          confidence: 0.7,
          source: 'OpenAI GPT-4 (Fallback)',
          parameters: {},
          followupActions: []
        };
      } catch (gptError) {
        throw createExternalAPIError('Chatbot', 'Error en servicio de chat');
      }
    }
  }

  /**
   * Obtiene respuesta de GPT-4 para preguntas sobre servicios eléctricos
   * @param {string} message - Pregunta del usuario
   * @returns {Promise<string>} - Respuesta generada
   */
  static async getGPTResponse(message) {
    try {
      const systemPrompt = `Eres un asistente especializado en servicios eléctricos domiciliarios en Chile. 
      Tienes conocimiento profundo sobre:
      - Normativas SEC (DS 8, Pliegos RIC 1-19)
      - Instalaciones eléctricas domiciliarias
      - Certificaciones TE1 y TC6
      - Procedimientos de seguridad eléctrica
      - Tipos de instalaciones (monofásicas, bifásicas, trifásicas)
      - Componentes eléctricos (tableros, interruptores, sistemas de puesta a tierra)
      
      Responde de manera clara, profesional y técnicamente precisa. 
      Si no tienes información específica, recomienda contactar a un técnico certificado SEC.
      Mantén las respuestas concisas (máximo 150 palabras).`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        max_tokens: 300,
        temperature: 0.3,
        presence_penalty: 0.1,
        frequency_penalty: 0.1
      });

      return completion.choices[0].message.content.trim();

    } catch (error) {
      console.error('Error en GPT-4:', error);
      throw createExternalAPIError('OpenAI', 'Error al generar respuesta');
    }
  }

  /**
   * Extrae acciones de seguimiento del resultado de Dialogflow
   * @param {Object} result - Resultado de Dialogflow
   * @returns {Array} - Array de acciones de seguimiento
   */
  static extractFollowupActions(result) {
    const actions = [];
    
    // Basado en el intent detectado, sugerir acciones
    const intent = result.intent.displayName;
    
    if (intent.includes('cotizacion') || intent.includes('presupuesto')) {
      actions.push({
        type: 'CREATE_QUOTATION',
        label: 'Solicitar Cotización',
        description: 'Crear una cotización personalizada'
      });
    }
    
    if (intent.includes('tecnico') || intent.includes('servicio')) {
      actions.push({
        type: 'FIND_TECHNICIAN',
        label: 'Buscar Técnico',
        description: 'Encontrar técnico certificado SEC'
      });
    }
    
    if (intent.includes('certificacion') || intent.includes('te1') || intent.includes('tc6')) {
      actions.push({
        type: 'CERTIFICATION_INFO',
        label: 'Información de Certificación',
        description: 'Obtener detalles sobre certificaciones SEC'
      });
    }

    return actions;
  }
}

/**
 * Servicio de generación de documentos con IA
 */
class DocumentGenerationService {
  /**
   * Genera contenido para reportes de diagnóstico
   * @param {Object} diagnosticData - Datos del diagnóstico
   * @returns {Promise<Object>} - Contenido generado para el reporte
   */
  static async generateDiagnosticReport(diagnosticData) {
    try {
      const prompt = `Genera un reporte de diagnóstico eléctrico profesional basado en los siguientes datos:

      DATOS DEL DIAGNÓSTICO:
      - Estado general: ${diagnosticData.generalCondition}
      - Ubicación: ${diagnosticData.location}
      - Componentes evaluados: ${JSON.stringify(diagnosticData.components, null, 2)}
      - Hallazgos de seguridad: ${JSON.stringify(diagnosticData.safetyFindings, null, 2)}

      FORMATO REQUERIDO:
      1. Resumen ejecutivo (máximo 100 palabras)
      2. Evaluación técnica detallada
      3. Cumplimiento normativo SEC
      4. Recomendaciones priorizadas
      5. Plan de acción sugerido

      El reporte debe ser técnicamente preciso, seguir normativas SEC, y estar en español formal.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "Eres un ingeniero eléctrico especialista en normativas SEC chilenas. Genera reportes técnicos profesionales." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1500,
        temperature: 0.2
      });

      const generatedContent = completion.choices[0].message.content;

      return {
        content: generatedContent,
        wordCount: generatedContent.split(' ').length,
        sections: this.extractReportSections(generatedContent),
        complianceScore: this.calculateComplianceFromContent(generatedContent)
      };

    } catch (error) {
      console.error('Error generando reporte de diagnóstico:', error);
      throw createExternalAPIError('OpenAI', 'Error al generar reporte de diagnóstico');
    }
  }

  /**
   * Genera recomendaciones técnicas basadas en hallazgos
   * @param {Array} findings - Array de hallazgos
   * @param {string} installationType - Tipo de instalación
   * @returns {Promise<Array>} - Array de recomendaciones
   */
  static async generateRecommendations(findings, installationType) {
    try {
      const prompt = `Basado en los siguientes hallazgos de una instalación eléctrica ${installationType}, 
      genera recomendaciones técnicas específicas según normativas SEC:

      HALLAZGOS:
      ${findings.map(f => `- ${f.component}: ${f.condition} (${f.observations})`).join('\n')}

      Para cada recomendación incluye:
      1. Descripción técnica
      2. Normativa SEC aplicable (RIC específico)
      3. Nivel de prioridad (Alta/Media/Baja)
      4. Tiempo estimado para implementación
      5. Consideraciones de seguridad

      Responde en formato JSON array.`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "Eres un experto en normativas SEC. Genera recomendaciones técnicas precisas en formato JSON." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 1000,
        temperature: 0.1
      });

      const response = completion.choices[0].message.content;
      
      // Intentar parsear JSON, si falla, generar estructura básica
      try {
        return JSON.parse(response);
      } catch (parseError) {
        return this.parseRecommendationsFromText(response);
      }

    } catch (error) {
      console.error('Error generando recomendaciones:', error);
      throw createExternalAPIError('OpenAI', 'Error al generar recomendaciones');
    }
  }

  /**
   * Genera descripción técnica para certificados SEC
   * @param {Object} workData - Datos del trabajo realizado
   * @param {string} certificateType - Tipo de certificado (TE1, TC6)
   * @returns {Promise<string>} - Descripción técnica generada
   */
  static async generateCertificateDescription(workData, certificateType) {
    try {
      const prompt = `Genera la descripción técnica para un certificado ${certificateType} basado en:

      TRABAJO REALIZADO:
      - Tipo: ${workData.workType}
      - Actividades: ${workData.activities.map(a => a.activity).join(', ')}
      - Componentes: ${workData.componentsChanged.map(c => `${c.component} (${c.action})`).join(', ')}
      - Pruebas: ${workData.testsPerformed.map(t => t.testType).join(', ')}

      La descripción debe:
      1. Ser técnicamente precisa
      2. Cumplir formato SEC
      3. Incluir especificaciones técnicas relevantes
      4. Máximo 200 palabras
      5. Lenguaje formal y profesional`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { 
            role: "system", 
            content: "Eres un técnico SEC certificado. Genera descripciones técnicas para certificados oficiales." 
          },
          { role: "user", content: prompt }
        ],
        max_tokens: 400,
        temperature: 0.1
      });

      return completion.choices[0].message.content.trim();

    } catch (error) {
      console.error('Error generando descripción de certificado:', error);
      throw createExternalAPIError('OpenAI', 'Error al generar descripción de certificado');
    }
  }

  // Métodos auxiliares
  static extractReportSections(content) {
    const sections = {};
    const lines = content.split('\n');
    let currentSection = 'introduction';
    let currentContent = [];

    for (const line of lines) {
      if (line.match(/^\d+\./)) {
        if (currentContent.length > 0) {
          sections[currentSection] = currentContent.join('\n').trim();
        }
        currentSection = line.toLowerCase().replace(/\d+\.\s*/, '').replace(/\s+/g, '_');
        currentContent = [];
      } else {
        currentContent.push(line);
      }
    }

    if (currentContent.length > 0) {
      sections[currentSection] = currentContent.join('\n').trim();
    }

    return sections;
  }

  static calculateComplianceFromContent(content) {
    const positiveWords = ['cumple', 'adecuado', 'correcto', 'bueno', 'excelente'];
    const negativeWords = ['incumple', 'inadecuado', 'deficiente', 'malo', 'crítico'];
    
    const words = content.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.some(pw => word.includes(pw))).length;
    const negativeCount = words.filter(word => negativeWords.some(nw => word.includes(nw))).length;
    
    const total = positiveCount + negativeCount;
    if (total === 0) return 75; // Score por defecto
    
    return Math.round((positiveCount / total) * 100);
  }

  static parseRecommendationsFromText(text) {
    // Fallback para cuando no se puede parsear JSON
    const lines = text.split('\n').filter(line => line.trim());
    const recommendations = [];
    
    for (const line of lines) {
      if (line.includes('-') || line.match(/^\d+\./)) {
        recommendations.push({
          description: line.replace(/^[-\d\.]\s*/, '').trim(),
          priority: 'Media',
          category: 'General',
          timeframe: 'A definir',
          ricStandard: 'Por determinar'
        });
      }
    }
    
    return recommendations.length > 0 ? recommendations : [{
      description: 'Realizar evaluación técnica completa según normativas SEC',
      priority: 'Alta',
      category: 'Cumplimiento Normativo',
      timeframe: '30 días',
      ricStandard: 'DS 8'
    }];
  }
}

module.exports = {
  SpeechToTextService,
  ChatbotService,
  DocumentGenerationService
};