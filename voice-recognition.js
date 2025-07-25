// Sistema de Reconocimiento de Voz para ElectriServ Chile
class VoiceRecognitionSystem {
    constructor() {
        this.recognition = null;
        this.isListening = false;
        this.isSupported = false;
        this.currentTarget = null;
        this.vocabulary = this.initializeVocabulary();
        this.init();
    }

    init() {
        // Verificar soporte para Web Speech API
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            this.isSupported = true;
            this.setupRecognition();
        } else {
            console.warn('Web Speech API no soportada en este navegador');
            this.showVoiceError('Su navegador no soporta reconocimiento de voz');
        }
    }

    setupRecognition() {
        // Usar la API disponible
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();

        // Configuración optimizada para español chileno
        this.recognition.lang = 'es-CL'; // Español de Chile
        this.recognition.interimResults = true; // Resultados intermedios
        this.recognition.continuous = false; // Una sola captura por sesión
        this.recognition.maxAlternatives = 3; // Hasta 3 alternativas

        // Event listeners
        this.recognition.onstart = () => this.onRecognitionStart();
        this.recognition.onresult = (event) => this.onRecognitionResult(event);
        this.recognition.onerror = (event) => this.onRecognitionError(event);
        this.recognition.onend = () => this.onRecognitionEnd();
    }

    initializeVocabulary() {
        // Vocabulario específico para servicios eléctricos chilenos
        return {
            // Términos técnicos básicos
            terminos_tecnicos: [
                'empalme', 'medidor', 'tablero', 'circuito', 'protección',
                'diferencial', 'térmica', 'automático', 'conductor', 'cable',
                'voltaje', 'amperaje', 'watt', 'kilowatt', 'potencia',
                'monofásico', 'bifásico', 'trifásico', 'neutro', 'tierra',
                'instalación', 'conexión', 'enchufes', 'interruptores'
            ],

            // Certificaciones y normativas
            certificaciones: [
                'TE1', 'te uno', 'técnico electricista clase uno',
                'TC6', 'te ce seis', 'técnico constructor clase seis',
                'SEC', 'superintendencia electricidad combustibles',
                'DS8', 'decreto supremo ocho',
                'RIC', 'reglamento instalaciones corrientes'
            ],

            // Servicios específicos
            servicios: [
                'empalme nuevo', 'ampliación', 'reparación', 'mantención',
                'cambio medidor', 'aumento potencia', 'normalización',
                'instalación domiciliaria', 'proyecto eléctrico'
            ],

            // Ubicaciones y medidas chilenas
            ubicaciones: [
                'región metropolitana', 'valparaíso', 'biobío', 'araucanía',
                'los lagos', 'antofagasta', 'atacama', 'coquimbo',
                'ohiggins', 'maule', 'ñuble', 'los ríos', 'aysén', 'magallanes'
            ],

            // Números y unidades
            numeros: [
                'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
                'once', 'doce', 'trece', 'catorce', 'quince', 'veinte', 'treinta', 'cuarenta', 'cincuenta',
                'cien', 'doscientos', 'trescientos', 'quinientos', 'mil'
            ],

            unidades: [
                'metros', 'metros cuadrados', 'kilowatt', 'kw', 'amperios', 'voltios',
                'milímetros', 'centímetros', 'pulgadas'
            ]
        };
    }

    // Iniciar reconocimiento de voz
    startListening(targetElement = null) {
        if (!this.isSupported) {
            this.showVoiceError('Reconocimiento de voz no disponible');
            return;
        }

        if (this.isListening) {
            this.stopListening();
            return;
        }

        this.currentTarget = targetElement;
        
        try {
            this.recognition.start();
        } catch (error) {
            console.error('Error al iniciar reconocimiento:', error);
            this.showVoiceError('Error al iniciar el reconocimiento de voz');
        }
    }

    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }

    onRecognitionStart() {
        this.isListening = true;
        this.updateVoiceUI(true);
        this.showVoiceStatus('Escuchando... Habla ahora');
    }

    onRecognitionResult(event) {
        let finalTranscript = '';
        let interimTranscript = '';

        // Procesar resultados
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            
            if (event.results[i].isFinal) {
                finalTranscript += transcript;
            } else {
                interimTranscript += transcript;
            }
        }

        // Mostrar resultado temporal
        if (interimTranscript) {
            this.showVoiceStatus(`Reconociendo: "${interimTranscript}"`);
        }

        // Procesar resultado final
        if (finalTranscript) {
            const processedText = this.processTranscript(finalTranscript);
            this.handleFinalResult(processedText);
        }
    }

    onRecognitionError(event) {
        console.error('Error de reconocimiento:', event.error);
        
        let errorMessage = 'Error en el reconocimiento de voz';
        
        switch (event.error) {
            case 'no-speech':
                errorMessage = 'No se detectó ningún audio. Intenta de nuevo.';
                break;
            case 'audio-capture':
                errorMessage = 'No se pudo acceder al micrófono.';
                break;
            case 'not-allowed':
                errorMessage = 'Permiso de micrófono denegado.';
                break;
            case 'network':
                errorMessage = 'Error de conexión. Verifica tu internet.';
                break;
            case 'service-not-allowed':
                errorMessage = 'Servicio de reconocimiento no disponible.';
                break;
        }
        
        this.showVoiceError(errorMessage);
        this.isListening = false;
        this.updateVoiceUI(false);
    }

    onRecognitionEnd() {
        this.isListening = false;
        this.updateVoiceUI(false);
        this.hideVoiceStatus();
    }

    processTranscript(transcript) {
        let processed = transcript.toLowerCase().trim();
        
        // Correcciones específicas para términos técnicos chilenos
        const corrections = {
            // Números
            'un': '1', 'uno': '1', 'dos': '2', 'tres': '3', 'cuatro': '4', 'cinco': '5',
            'seis': '6', 'siete': '7', 'ocho': '8', 'nueve': '9', 'diez': '10',
            'once': '11', 'doce': '12', 'trece': '13', 'catorce': '14', 'quince': '15',
            'veinte': '20', 'treinta': '30', 'cuarenta': '40', 'cincuenta': '50',
            'cien': '100', 'mil': '1000',

            // Términos técnicos
            'te uno': 'TE1', 'te 1': 'TE1', 'técnico electricista': 'TE1',
            'te ce seis': 'TC6', 'tc 6': 'TC6', 'te seis': 'TC6',
            'se c': 'SEC', 's e c': 'SEC',
            'de s ocho': 'DS 8', 'ds ocho': 'DS 8',
            'ric': 'RIC', 'r i c': 'RIC',

            // Correcciones comunes en español chileno
            'pa que': 'para que', 'pal': 'para el', 'por fa': 'por favor',
            'altiro': 'al tiro', 'caleta': 'mucho', 'bacán': 'bueno',
            'ampolleta': 'ampolleta', 'enchufe': 'enchufe',

            // Unidades y medidas
            'kilo watt': 'kilowatt', 'kilo': 'kilo', 'metro cuadrado': 'm²',
            'centímetro': 'cm', 'milímetro': 'mm',

            // Voltajes comunes
            'doscientos veinte': '220', 'trescientos ochenta': '380',
            'cuatrocientos': '400'
        };

        // Aplicar correcciones
        Object.keys(corrections).forEach(key => {
            const regex = new RegExp(`\\b${key}\\b`, 'gi');
            processed = processed.replace(regex, corrections[key]);
        });

        // Capitalizar primera letra de oraciones
        processed = processed.replace(/(^|\. )(\w)/g, (match, prefix, letter) => {
            return prefix + letter.toUpperCase();
        });

        return processed;
    }

    handleFinalResult(text) {
        if (this.currentTarget) {
            // Insertar texto en el elemento objetivo
            if (this.currentTarget.tagName === 'TEXTAREA' || this.currentTarget.tagName === 'INPUT') {
                const currentValue = this.currentTarget.value;
                const newValue = currentValue ? `${currentValue} ${text}` : text;
                this.currentTarget.value = newValue;
                
                // Trigger input event para validaciones
                this.currentTarget.dispatchEvent(new Event('input', { bubbles: true }));
            }
        } else {
            // Si no hay objetivo específico, usar el chatbot
            const chatInput = document.getElementById('chatInput');
            if (chatInput) {
                chatInput.value = text;
            }
        }

        this.showVoiceSuccess(`Texto reconocido: "${text}"`);
        this.currentTarget = null;
    }

    // Funciones de UI
    updateVoiceUI(isListening) {
        const voiceButtons = document.querySelectorAll('.voice-btn, .btn-voice');
        
        voiceButtons.forEach(button => {
            if (isListening) {
                button.classList.add('listening');
                button.innerHTML = '<i class="fas fa-stop"></i> Detener';
                button.style.background = '#ef4444';
            } else {
                button.classList.remove('listening');
                button.innerHTML = '<i class="fas fa-microphone"></i> Voz';
                button.style.background = '#f59e0b';
            }
        });
    }

    showVoiceStatus(message) {
        this.hideVoiceStatus(); // Limpiar status anterior
        
        const status = document.createElement('div');
        status.id = 'voiceStatus';
        status.className = 'voice-status';
        status.innerHTML = `
            <div class="voice-status-content">
                <i class="fas fa-microphone pulse"></i>
                <span>${message}</span>
            </div>
        `;
        
        status.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(245, 158, 11, 0.95);
            color: white;
            padding: 1rem 2rem;
            border-radius: 12px;
            z-index: 10001;
            font-weight: 500;
            box-shadow: 0 8px 24px rgba(0,0,0,0.2);
            backdrop-filter: blur(8px);
        `;
        
        document.body.appendChild(status);
    }

    hideVoiceStatus() {
        const status = document.getElementById('voiceStatus');
        if (status) {
            status.remove();
        }
    }

    showVoiceSuccess(message) {
        this.hideVoiceStatus();
        
        // Usar el sistema de mensajes existente
        if (typeof showMessage === 'function') {
            showMessage(message, 'success');
        } else {
            console.log('Voice Success:', message);
        }
    }

    showVoiceError(message) {
        this.hideVoiceStatus();
        
        // Usar el sistema de mensajes existente
        if (typeof showMessage === 'function') {
            showMessage(message, 'error');
        } else {
            console.error('Voice Error:', message);
        }
    }

    // Método para verificar permisos de micrófono
    async checkMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            return true;
        } catch (error) {
            console.warn('No se pudo acceder al micrófono:', error);
            return false;
        }
    }

    // Obtener información del navegador y soporte
    getBrowserInfo() {
        const isChrome = /Chrome/.test(navigator.userAgent);
        const isFirefox = /Firefox/.test(navigator.userAgent);
        const isSafari = /Safari/.test(navigator.userAgent) && !/Chrome/.test(navigator.userAgent);
        
        return {
            isChrome,
            isFirefox,
            isSafari,
            hasWebkitSpeech: 'webkitSpeechRecognition' in window,
            hasSpeechRecognition: 'SpeechRecognition' in window,
            isSupported: this.isSupported
        };
    }
}

// Instancia global del sistema de voz
let voiceSystem = null;

// Inicializar sistema de voz
function initializeVoiceSystem() {
    if (!voiceSystem) {
        voiceSystem = new VoiceRecognitionSystem();
    }
    return voiceSystem;
}

// Funciones exportadas para uso global

// Iniciar reconocimiento de voz general
function startVoiceRecognition() {
    const voice = initializeVoiceSystem();
    voice.startListening();
}

// Iniciar reconocimiento para input específico del chatbot
function startVoiceInput() {
    const voice = initializeVoiceSystem();
    const chatInput = document.getElementById('chatInput');
    voice.startListening(chatInput);
}

// Iniciar reconocimiento para descripción en cotizador
function startVoiceDescription() {
    const voice = initializeVoiceSystem();
    const descriptionField = document.getElementById('descripcionText');
    if (descriptionField) {
        voice.startListening(descriptionField);
    } else {
        voice.startListening();
    }
}

// Función para elementos con data-voice
function startVoiceForElement(elementId) {
    const voice = initializeVoiceSystem();
    const element = document.getElementById(elementId);
    if (element) {
        voice.startListening(element);
    }
}

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar sistema de voz
    initializeVoiceSystem();
    
    // Agregar listeners a elementos con atributo data-voice
    const voiceElements = document.querySelectorAll('[data-voice]');
    voiceElements.forEach(element => {
        element.addEventListener('click', function() {
            const targetId = this.getAttribute('data-voice');
            startVoiceForElement(targetId);
        });
    });
});

// CSS para animaciones de voz (agregar dinámicamente)
const voiceCSS = `
.voice-status-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.pulse {
    animation: pulse-voice 1.5s infinite;
}

@keyframes pulse-voice {
    0% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.1); }
    100% { opacity: 1; transform: scale(1); }
}

.voice-btn.listening {
    animation: listening-glow 2s infinite;
}

@keyframes listening-glow {
    0% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); }
    50% { box-shadow: 0 0 20px rgba(239, 68, 68, 0.8), 0 0 30px rgba(239, 68, 68, 0.4); }
    100% { box-shadow: 0 0 5px rgba(239, 68, 68, 0.5); }
}
`;

// Inyectar CSS si no existe
if (!document.getElementById('voice-recognition-styles')) {
    const style = document.createElement('style');
    style.id = 'voice-recognition-styles';
    style.textContent = voiceCSS;
    document.head.appendChild(style);
}

// Exportar funciones para uso global
window.startVoiceRecognition = startVoiceRecognition;
window.startVoiceInput = startVoiceInput;
window.startVoiceDescription = startVoiceDescription;
window.startVoiceForElement = startVoiceForElement;