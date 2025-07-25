// Chatbot especializado en normativas SEC de Chile
class SECChatbot {
    constructor() {
        this.knowledgeBase = this.initializeKnowledgeBase();
        this.conversationHistory = [];
        this.currentContext = null;
    }

    initializeKnowledgeBase() {
        return {
            // Normativas y regulaciones
            normativas: {
                'ds8': {
                    nombre: 'Decreto Supremo N°8',
                    descripcion: 'Reglamento de Servicios Eléctricos',
                    aplicacion: 'Regula la prestación de servicios eléctricos en Chile',
                    puntos_clave: [
                        'Requisitos técnicos para conexiones',
                        'Estándares de calidad de servicio',
                        'Procedimientos de facturación',
                        'Derechos y deberes de usuarios'
                    ]
                },
                'ric1-19': {
                    nombre: 'RIC 1-19',
                    descripcion: 'Reglamento de Instalaciones de Corrientes Fuertes',
                    aplicacion: 'Normas técnicas para instalaciones eléctricas',
                    puntos_clave: [
                        'Diseño de instalaciones eléctricas',
                        'Materiales y equipos permitidos',
                        'Métodos de instalación',
                        'Sistemas de protección',
                        'Puestas a tierra'
                    ]
                }
            },

            // Certificaciones técnicas
            certificaciones: {
                'te1': {
                    nombre: 'Técnico Electricista Clase 1',
                    descripcion: 'Certificación para trabajos en baja tensión',
                    requisitos: [
                        'Curso de formación técnica',
                        'Examen teórico y práctico',
                        'Experiencia mínima 2 años',
                        'Renovación cada 5 años'
                    ],
                    trabajos_permitidos: [
                        'Instalaciones domiciliarias hasta 10 kW',
                        'Mantención de equipos BT',
                        'Conexiones de empalmes residenciales'
                    ]
                },
                'tc6': {
                    nombre: 'Técnico Constructor Clase 6',
                    descripcion: 'Certificación para construcción de obras eléctricas',
                    requisitos: [
                        'Título técnico o profesional',
                        'Experiencia en construcción eléctrica',
                        'Examen de competencias',
                        'Registro vigente en SEC'
                    ],
                    trabajos_permitidos: [
                        'Supervisión de obras eléctricas',
                        'Instalaciones industriales',
                        'Proyectos de media tensión'
                    ]
                }
            },

            // Tipos de empalmes y servicios
            empalmes: {
                'monofasico': {
                    descripcion: 'Empalme para cargas hasta 5 kW',
                    voltaje: '220V',
                    uso_tipico: 'Casas pequeñas, departamentos',
                    requisitos: [
                        'Medidor monofásico',
                        'Tablero principal 4-8 circuitos',
                        'Protección diferencial 25A',
                        'Conductor 4mm² mínimo'
                    ]
                },
                'bifasico': {
                    descripcion: 'Empalme para cargas entre 5-10 kW',
                    voltaje: '220V bifásico',
                    uso_tipico: 'Casas medianas, pequeños comercios',
                    requisitos: [
                        'Medidor bifásico',
                        'Tablero principal 12-16 circuitos',
                        'Protección diferencial 40A',
                        'Conductor 6mm² mínimo'
                    ]
                },
                'trifasico': {
                    descripcion: 'Empalme para cargas superiores a 10 kW',
                    voltaje: '380V trifásico',
                    uso_tipico: 'Casas grandes, comercios, industrias pequeñas',
                    requisitos: [
                        'Medidor trifásico',
                        'Tablero principal 24+ circuitos',
                        'Protección diferencial según carga',
                        'Conductor 10mm² mínimo'
                    ]
                }
            },

            // Preguntas frecuentes
            faq: {
                'que_documentos_empalme': {
                    pregunta: '¿Qué documentos necesito para un empalme nuevo?',
                    respuesta: 'Para un empalme nuevo necesitas: Formulario TE1 firmado por técnico certificado, planos de la instalación eléctrica, certificado de cumplimiento normativo, permiso municipal de edificación y comprobante de pago de derechos.'
                },
                'tiempo_tramite_empalme': {
                    pregunta: '¿Cuánto demora el trámite de empalme?',
                    respuesta: 'El trámite típico demora entre 15 a 30 días hábiles desde la presentación completa de documentos. Esto incluye revisión técnica, inspección y conexión final.'
                },
                'costo_empalme': {
                    pregunta: '¿Cuál es el costo de un empalme?',
                    respuesta: 'Los costos varían según la potencia: Monofásico (5kW): $150.000-200.000, Bifásico (10kW): $200.000-300.000, Trifásico (15kW+): $300.000-500.000. Incluye materiales, mano de obra y derechos.'
                },
                'que_es_te1': {
                    pregunta: '¿Qué es la certificación TE1?',
                    respuesta: 'TE1 es la certificación de Técnico Electricista Clase 1, requerida para realizar trabajos eléctricos en baja tensión. Es obligatoria para instalaciones domiciliarias y debe estar vigente.'
                }
            },

            // Troubleshooting común
            troubleshooting: {
                'corte_luz_frecuente': {
                    problema: 'Se corta la luz frecuentemente',
                    causas_posibles: [
                        'Sobrecarga en circuito',
                        'Protector defectuoso',
                        'Problema en la instalación',
                        'Falla en el medidor'
                    ],
                    solucion: 'Verificar cargas conectadas, revisar estado de protecciones y contactar técnico TE1 para inspección.'
                },
                'chispas_enchufes': {
                    problema: 'Chispas en enchufes',
                    causas_posibles: [
                        'Conexiones flojas',
                        'Sobrecarga',
                        'Humedad en instalación',
                        'Equipos defectuosos'
                    ],
                    solucion: 'PELIGRO: Desconectar inmediatamente. Llamar técnico certificado. No usar hasta reparación completa.'
                }
            }
        };
    }

    // Procesar mensaje del usuario
    processMessage(userMessage) {
        const message = userMessage.toLowerCase().trim();
        this.conversationHistory.push({ type: 'user', message: userMessage });

        let response = this.generateResponse(message);
        
        this.conversationHistory.push({ type: 'bot', message: response });
        return response;
    }

    generateResponse(message) {
        // Detectar intención del usuario
        const intent = this.detectIntent(message);
        
        switch (intent.type) {
            case 'normativa':
                return this.handleNormativaQuery(intent.entity);
            case 'certificacion':
                return this.handleCertificacionQuery(intent.entity);
            case 'empalme':
                return this.handleEmpalmeQuery(intent.entity);
            case 'faq':
                return this.handleFAQQuery(intent.entity);
            case 'troubleshooting':
                return this.handleTroubleshootingQuery(intent.entity);
            case 'saludo':
                return this.handleGreeting();
            case 'despedida':
                return this.handleFarewell();
            default:
                return this.handleUnknownQuery(message);
        }
    }

    detectIntent(message) {
        // Palabras clave para normativas
        if (this.containsKeywords(message, ['ds 8', 'ds8', 'decreto supremo', 'reglamento servicios'])) {
            return { type: 'normativa', entity: 'ds8' };
        }
        if (this.containsKeywords(message, ['ric', 'ric 1-19', 'instalaciones corrientes'])) {
            return { type: 'normativa', entity: 'ric1-19' };
        }

        // Palabras clave para certificaciones
        if (this.containsKeywords(message, ['te1', 'tecnico electricista', 'certificacion te1'])) {
            return { type: 'certificacion', entity: 'te1' };
        }
        if (this.containsKeywords(message, ['tc6', 'tecnico constructor', 'certificacion tc6'])) {
            return { type: 'certificacion', entity: 'tc6' };
        }

        // Palabras clave para empalmes
        if (this.containsKeywords(message, ['empalme', 'conexion', 'nuevo servicio'])) {
            if (this.containsKeywords(message, ['monofasico', 'monofásico'])) {
                return { type: 'empalme', entity: 'monofasico' };
            }
            if (this.containsKeywords(message, ['bifasico', 'bifásico'])) {
                return { type: 'empalme', entity: 'bifasico' };
            }
            if (this.containsKeywords(message, ['trifasico', 'trifásico'])) {
                return { type: 'empalme', entity: 'trifasico' };
            }
            return { type: 'empalme', entity: 'general' };
        }

        // Preguntas frecuentes específicas
        if (this.containsKeywords(message, ['documentos', 'papeles', 'requisitos empalme'])) {
            return { type: 'faq', entity: 'que_documentos_empalme' };
        }
        if (this.containsKeywords(message, ['tiempo', 'demora', 'cuanto demora'])) {
            return { type: 'faq', entity: 'tiempo_tramite_empalme' };
        }
        if (this.containsKeywords(message, ['costo', 'precio', 'cuanto cuesta'])) {
            return { type: 'faq', entity: 'costo_empalme' };
        }

        // Troubleshooting
        if (this.containsKeywords(message, ['se corta', 'corte luz', 'salta termica'])) {
            return { type: 'troubleshooting', entity: 'corte_luz_frecuente' };
        }
        if (this.containsKeywords(message, ['chispas', 'chispa', 'chispear'])) {
            return { type: 'troubleshooting', entity: 'chispas_enchufes' };
        }

        // Saludos y despedidas
        if (this.containsKeywords(message, ['hola', 'buenos dias', 'buenas tardes', 'saludos'])) {
            return { type: 'saludo' };
        }
        if (this.containsKeywords(message, ['chao', 'adios', 'gracias', 'hasta luego'])) {
            return { type: 'despedida' };
        }

        return { type: 'unknown' };
    }

    containsKeywords(message, keywords) {
        return keywords.some(keyword => message.includes(keyword));
    }

    handleNormativaQuery(normativa) {
        const data = this.knowledgeBase.normativas[normativa];
        if (!data) return this.handleUnknownQuery();

        return `📋 **${data.nombre}** - ${data.descripcion}

**Aplicación:** ${data.aplicacion}

**Puntos clave:**
${data.puntos_clave.map(punto => `• ${punto}`).join('\n')}

¿Te gustaría saber algo específico sobre esta normativa?`;
    }

    handleCertificacionQuery(certificacion) {
        const data = this.knowledgeBase.certificaciones[certificacion];
        if (!data) return this.handleUnknownQuery();

        return `🎓 **${data.nombre}**

${data.descripcion}

**Requisitos para obtenerla:**
${data.requisitos.map(req => `• ${req}`).join('\n')}

**Trabajos permitidos:**
${data.trabajos_permitidos.map(trabajo => `• ${trabajo}`).join('\n')}

¿Necesitas ayuda con el proceso de certificación?`;
    }

    handleEmpalmeQuery(tipoEmpalme) {
        if (tipoEmpalme === 'general') {
            return `⚡ **Tipos de Empalme Disponibles:**

🔌 **Monofásico** - Hasta 5 kW (casas pequeñas)
🔌 **Bifásico** - 5-10 kW (casas medianas) 
🔌 **Trifásico** - Más de 10 kW (casas grandes, comercios)

Para ayudarte mejor, ¿podrías decirme qué tipo de empalme necesitas o cuál es la potencia requerida?

También puedo ayudarte con:
• Requisitos y documentos
• Tiempos de tramitación
• Costos aproximados`;
        }

        const data = this.knowledgeBase.empalmes[tipoEmpalme];
        if (!data) return this.handleUnknownQuery();

        return `⚡ **Empalme ${tipoEmpalme.charAt(0).toUpperCase() + tipoEmpalme.slice(1)}**

${data.descripcion}
**Voltaje:** ${data.voltaje}
**Uso típico:** ${data.uso_tipico}

**Requisitos técnicos:**
${data.requisitos.map(req => `• ${req}`).join('\n')}

¿Necesitas información sobre el proceso de solicitud o costos?`;
    }

    handleFAQQuery(faqKey) {
        const data = this.knowledgeBase.faq[faqKey];
        if (!data) return this.handleUnknownQuery();

        return `❓ **${data.pregunta}**

${data.respuesta}

¿Hay algo más específico que te gustaría saber?`;
    }

    handleTroubleshootingQuery(problemKey) {
        const data = this.knowledgeBase.troubleshooting[problemKey];
        if (!data) return this.handleUnknownQuery();

        return `⚠️ **Problema:** ${data.problema}

**Posibles causas:**
${data.causas_posibles.map(causa => `• ${causa}`).join('\n')}

**Solución recomendada:**
${data.solucion}

⚠️ **IMPORTANTE:** Si es un problema de seguridad, contacta inmediatamente a un técnico TE1 certificado.`;
    }

    handleGreeting() {
        const greetings = [
            '¡Hola! Soy tu asistente especializado en normativas SEC. ¿En qué puedo ayudarte hoy?',
            '¡Buenos días! Estoy aquí para resolver tus dudas sobre servicios eléctricos y normativas SEC.',
            '¡Saludos! Soy el chatbot de ElectriServ Chile. ¿Qué información necesitas sobre instalaciones eléctricas?'
        ];
        
        const greeting = greetings[Math.floor(Math.random() * greetings.length)];
        
        return `${greeting}

Puedo ayudarte con:
• Normativas SEC (DS 8, RIC 1-19)
• Certificaciones TE1/TC6
• Requisitos para empalmes
• Troubleshooting básico
• Procesos y documentación`;
    }

    handleFarewell() {
        const farewells = [
            '¡Hasta luego! Si tienes más dudas sobre servicios eléctricos, no dudes en consultarme.',
            '¡Que tengas un buen día! Recuerda siempre usar técnicos certificados para trabajos eléctricos.',
            '¡Adiós! Para cualquier instalación eléctrica, asegúrate de cumplir con las normativas SEC.'
        ];
        
        return farewells[Math.floor(Math.random() * farewells.length)];
    }

    handleUnknownQuery(message = '') {
        return `🤔 No estoy seguro de cómo ayudarte con esa consulta específica.

**Puedo ayudarte con:**
• Información sobre normativas SEC (DS 8, RIC 1-19)
• Certificaciones técnicas (TE1, TC6)
• Requisitos para empalmes eléctricos
• Costos y tiempos de tramitación
• Solución de problemas básicos

¿Podrías reformular tu pregunta o elegir uno de estos temas?

También puedes usar los botones de consulta rápida para temas comunes.`;
    }

    // Obtener sugerencias basadas en el contexto
    getSuggestions() {
        return [
            'Requisitos para empalme nuevo',
            'Diferencia entre TE1 y TC6',
            'Costos de instalación eléctrica',
            'Normativa RIC 1-19',
            'Tiempo de tramitación SEC'
        ];
    }
}

// Instancia global del chatbot
let secChatbot = null;

// Inicializar chatbot
function initializeChatbot() {
    if (!secChatbot) {
        secChatbot = new SECChatbot();
    }
    
    // Limpiar chat si es la primera vez
    const messagesContainer = document.getElementById('chatbotMessages');
    if (messagesContainer && messagesContainer.children.length === 1) {
        // Mantener solo el mensaje de bienvenida inicial
        addChatbotMessage(secChatbot.handleGreeting(), 'bot');
    }
}

// Enviar mensaje al chatbot
function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    // Mostrar mensaje del usuario
    addChatbotMessage(message, 'user');
    input.value = '';
    
    // Mostrar indicador de escritura
    showTypingIndicator();
    
    // Procesar respuesta del chatbot
    setTimeout(() => {
        hideTypingIndicator();
        const response = secChatbot.processMessage(message);
        addChatbotMessage(response, 'bot');
        
        // Scroll automático
        scrollChatToBottom();
    }, 1000 + Math.random() * 1000);
}

// Enviar mensaje rápido
function sendQuickMessage(message) {
    const input = document.getElementById('chatInput');
    input.value = message;
    sendMessage();
}

// Agregar mensaje al chat
function addChatbotMessage(message, type) {
    const messagesContainer = document.getElementById('chatbotMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    
    const timestamp = new Date().toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    // Formatear mensaje (convertir markdown básico a HTML)
    const formattedMessage = formatMessage(message);
    
    messageDiv.innerHTML = `
        <p>${formattedMessage}</p>
        <small>${timestamp}</small>
    `;
    
    messagesContainer.appendChild(messageDiv);
    scrollChatToBottom();
}

// Formatear mensaje con markdown básico
function formatMessage(message) {
    return message
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // **bold**
        .replace(/\*(.*?)\*/g, '<em>$1</em>') // *italic*
        .replace(/\n/g, '<br>') // saltos de línea
        .replace(/•/g, '&bull;'); // viñetas
}

// Mostrar indicador de escritura
function showTypingIndicator() {
    const messagesContainer = document.getElementById('chatbotMessages');
    const typingDiv = document.createElement('div');
    typingDiv.className = 'bot-message typing-indicator';
    typingDiv.id = 'typingIndicator';
    typingDiv.innerHTML = `
        <p>
            <span class="typing-dots">
                <span></span>
                <span></span>
                <span></span>
            </span>
        </p>
    `;
    
    messagesContainer.appendChild(typingDiv);
    scrollChatToBottom();
}

// Ocultar indicador de escritura
function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typingIndicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
}

// Scroll automático del chat
function scrollChatToBottom() {
    const messagesContainer = document.getElementById('chatbotMessages');
    if (messagesContainer) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
}

// Event listeners para el chatbot
document.addEventListener('DOMContentLoaded', function() {
    // Enter para enviar mensaje
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
});

// Exportar funciones para uso global
window.sendMessage = sendMessage;
window.sendQuickMessage = sendQuickMessage;
window.initializeChatbot = initializeChatbot;