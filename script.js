// Variables globales
let currentUser = null;
let isAuthenticated = false;

// Inicialización cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    setupSmoothScrolling();
    checkAuthenticationStatus();
});

// Función de inicialización
function initializeApp() {
    console.log('ElectriServ Chile - Sistema iniciado');
    
    // Verificar soporte para APIs requeridas
    if (!('speechSynthesis' in window)) {
        console.warn('Web Speech API no soportada en este navegador');
    }
    
    // Inicializar módulos
    initializeModules();
    
    // Mostrar mensaje de bienvenida
    showWelcomeMessage();
}

// Configurar event listeners
function setupEventListeners() {
    // Navegación móvil
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.querySelector('.nav-menu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }
    
    // Cerrar menú móvil al hacer clic en un enlace
    const navLinks = document.querySelectorAll('.nav-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });
    
    // Botón de login
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', openLoginModal);
    }
    
    // Modales - cerrar con X
    const closeButtons = document.querySelectorAll('.close');
    closeButtons.forEach(button => {
        button.addEventListener('click', closeModal);
    });
    
    // Cerrar modales haciendo clic fuera
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    });
    
    // Formulario de cotización
    const cotizacionForm = document.getElementById('cotizacionForm');
    if (cotizacionForm) {
        cotizacionForm.addEventListener('submit', handleCotizacionSubmit);
    }
    
    // Botones de opciones de login
    const claveUnicaBtn = document.querySelector('.btn-clave-unica');
    const firebaseBtn = document.querySelector('.btn-firebase');
    
    if (claveUnicaBtn) {
        claveUnicaBtn.addEventListener('click', handleClaveUnicaLogin);
    }
    
    if (firebaseBtn) {
        firebaseBtn.addEventListener('click', handleFirebaseLogin);
    }
    
    // Formulario de login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleEmailLogin);
    }
}

// Navegación suave
function setupSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Gestión de módulos
function initializeModules() {
    const moduleCards = document.querySelectorAll('.module-card');
    
    moduleCards.forEach((card, index) => {
        // Animación de entrada escalonada
        setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, index * 100);
    });
}

// Toggle de contenido de módulos
function toggleModule(moduleId) {
    const content = document.getElementById(`${moduleId}-content`);
    const button = content.previousElementSibling;
    
    if (content.classList.contains('hidden')) {
        content.classList.remove('hidden');
        button.textContent = 'Ocultar Detalles';
        content.style.animation = 'fadeInUp 0.3s ease-out';
    } else {
        content.classList.add('hidden');
        button.textContent = 'Ver Detalles';
    }
}

// Gestión de modales
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
        
        // Animación de entrada
        setTimeout(() => {
            modal.querySelector('.modal-content').style.transform = 'scale(1)';
            modal.querySelector('.modal-content').style.opacity = '1';
        }, 10);
    }
}

function closeModal() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.style.display = 'none';
    });
    document.body.style.overflow = 'auto';
}

// Funciones específicas de modales
function openLoginModal() {
    openModal('loginModal');
}

function openChatbot() {
    openModal('chatbotModal');
    initializeChatbot();
}

function openCotizador() {
    if (!isAuthenticated) {
        showMessage('Debe iniciar sesión para generar cotizaciones', 'warning');
        openLoginModal();
        return;
    }
    openModal('cotizadorModal');
}

function openRealTimeChat() {
    if (!isAuthenticated) {
        showMessage('Debe iniciar sesión para acceder al chat', 'warning');
        openLoginModal();
        return;
    }
    openModal('realTimeChatModal');
    initializeRealTimeChat();
}

// Autenticación
function checkAuthenticationStatus() {
    // Verificar si hay una sesión activa (Firebase, localStorage, etc.)
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
        isAuthenticated = true;
        updateUIForAuthenticatedUser();
    }
}

function handleClaveUnicaLogin() {
    showMessage('Redirigiendo a ClaveÚnica...', 'info');
    
    // Simulación de integración con ClaveÚnica
    setTimeout(() => {
        // En una implementación real, aquí se haría la integración con ClaveÚnica
        const mockUser = {
            id: 'clave-unica-123',
            name: 'Juan Pérez',
            email: 'juan.perez@email.com',
            type: 'cliente',
            authMethod: 'claveunica'
        };
        
        authenticateUser(mockUser);
        closeModal();
        showMessage('Sesión iniciada con ClaveÚnica correctamente', 'success');
    }, 2000);
}

function handleFirebaseLogin() {
    const loginForm = document.getElementById('loginForm');
    loginForm.classList.remove('hidden');
}

function handleEmailLogin(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const email = formData.get('email') || e.target.querySelector('input[type="email"]').value;
    const password = formData.get('password') || e.target.querySelector('input[type="password"]').value;
    
    if (!email || !password) {
        showMessage('Por favor complete todos los campos', 'error');
        return;
    }
    
    // Mostrar loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span>Iniciando sesión...';
    submitBtn.disabled = true;
    
    // Simulación de autenticación con Firebase
    setTimeout(() => {
        if (email && password.length >= 6) {
            const mockUser = {
                id: 'firebase-456',
                name: email.split('@')[0],
                email: email,
                type: 'cliente',
                authMethod: 'firebase'
            };
            
            authenticateUser(mockUser);
            closeModal();
            showMessage('Sesión iniciada correctamente', 'success');
        } else {
            showMessage('Credenciales incorrectas', 'error');
        }
        
        // Restaurar botón
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }, 1500);
}

function authenticateUser(user) {
    currentUser = user;
    isAuthenticated = true;
    localStorage.setItem('currentUser', JSON.stringify(user));
    updateUIForAuthenticatedUser();
}

function updateUIForAuthenticatedUser() {
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn && currentUser) {
        loginBtn.textContent = `Hola, ${currentUser.name}`;
        loginBtn.onclick = showUserMenu;
    }
}

function showUserMenu() {
    // Implementar menú de usuario
    const menu = document.createElement('div');
    menu.className = 'user-menu';
    menu.innerHTML = `
        <div class="user-menu-content">
            <p><strong>${currentUser.name}</strong></p>
            <p>${currentUser.email}</p>
            <hr>
            <button onclick="logout()">Cerrar Sesión</button>
        </div>
    `;
    
    document.body.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', function removeMenu() {
            if (menu.parentNode) {
                menu.parentNode.removeChild(menu);
            }
            document.removeEventListener('click', removeMenu);
        });
    }, 100);
}

function logout() {
    currentUser = null;
    isAuthenticated = false;
    localStorage.removeItem('currentUser');
    
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.textContent = 'Iniciar Sesión';
        loginBtn.onclick = openLoginModal;
    }
    
    showMessage('Sesión cerrada correctamente', 'info');
}

// Manejo de cotizaciones
function handleCotizacionSubmit(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const cotizacion = {
        servicio: formData.get('servicio'),
        potencia: formData.get('potencia'),
        direccion: formData.get('direccion'),
        descripcion: formData.get('descripcion'),
        cliente: currentUser,
        fecha: new Date().toISOString(),
        id: generateId()
    };
    
    if (!cotizacion.servicio || !cotizacion.potencia || !cotizacion.direccion) {
        showMessage('Por favor complete todos los campos obligatorios', 'error');
        return;
    }
    
    // Mostrar loading
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span>Generando PDF...';
    submitBtn.disabled = true;
    
    // Simular generación de PDF
    setTimeout(() => {
        generatePDFQuote(cotizacion);
        saveCotizacion(cotizacion);
        
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        
        showMessage('Cotización generada y enviada correctamente', 'success');
        closeModal();
        
        // Limpiar formulario
        e.target.reset();
    }, 2000);
}

function generatePDFQuote(cotizacion) {
    // En una implementación real, aquí se usaría PDFKit
    console.log('Generando PDF para cotización:', cotizacion);
    
    // Simular descarga de PDF
    const blob = new Blob(['Cotización ElectriServ Chile\n\n' + JSON.stringify(cotizacion, null, 2)], 
                         { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizacion_${cotizacion.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function saveCotizacion(cotizacion) {
    // Guardar en localStorage (en producción sería MongoDB)
    const cotizaciones = JSON.parse(localStorage.getItem('cotizaciones') || '[]');
    cotizaciones.push(cotizacion);
    localStorage.setItem('cotizaciones', JSON.stringify(cotizaciones));
}

// Chat en tiempo real
function initializeRealTimeChat() {
    const messages = document.getElementById('realTimeMessages');
    if (messages && messages.children.length <= 1) {
        // Simular conexión con técnico
        setTimeout(() => {
            addRealTimeMessage('Técnico Mario Sánchez conectado. TE1 certificado.', 'system');
        }, 1000);
    }
}

function sendRealTimeMessage() {
    const input = document.getElementById('realTimeChatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    addRealTimeMessage(message, 'user');
    input.value = '';
    
    // Simular respuesta del técnico
    setTimeout(() => {
        const responses = [
            'Entiendo su consulta. ¿Podría proporcionar más detalles sobre la instalación?',
            'Según la normativa RIC 1-19, necesitaremos verificar la capacidad del tablero.',
            'Para cumplir con DS 8, recomiendo una inspección previa del sitio.',
            'Como técnico TE1 certificado, puedo confirmar que el procedimiento es correcto.'
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        addRealTimeMessage(randomResponse, 'technician');
    }, 1000 + Math.random() * 2000);
}

function addRealTimeMessage(message, type) {
    const messages = document.getElementById('realTimeMessages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `${type}-message`;
    
    const timestamp = new Date().toLocaleTimeString('es-CL', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
    
    messageDiv.innerHTML = `
        <p>${message}</p>
        <small>${timestamp}</small>
    `;
    
    messages.appendChild(messageDiv);
    messages.scrollTop = messages.scrollHeight;
}

function uploadImage() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            addRealTimeMessage(`📷 Imagen enviada: ${file.name}`, 'user');
            
            setTimeout(() => {
                addRealTimeMessage('Imagen recibida. Revisando la instalación...', 'technician');
            }, 1000);
        }
    };
    
    input.click();
}

// Utilidades
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function showMessage(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <i class="fas fa-${getIconForType(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    // Estilos del toast
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getColorForType(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        max-width: 400px;
    `;
    
    document.body.appendChild(toast);
    
    // Animación de entrada
    setTimeout(() => {
        toast.style.transform = 'translateX(0)';
    }, 100);
    
    // Auto-remover después de 4 segundos
    setTimeout(() => {
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, 4000);
}

function getIconForType(type) {
    const icons = {
        success: 'check-circle',
        error: 'exclamation-circle',
        warning: 'exclamation-triangle',
        info: 'info-circle'
    };
    return icons[type] || 'info-circle';
}

function getColorForType(type) {
    const colors = {
        success: '#22c55e',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#2563eb'
    };
    return colors[type] || '#2563eb';
}

function showWelcomeMessage() {
    setTimeout(() => {
        showMessage('Bienvenido a ElectriServ Chile - Sistema de servicios eléctricos certificados SEC', 'info');
    }, 1000);
}

// Eventos del teclado
document.addEventListener('keydown', function(e) {
    // Cerrar modales con Escape
    if (e.key === 'Escape') {
        closeModal();
    }
    
    // Enter en chat
    if (e.key === 'Enter' && e.target.id === 'realTimeChatInput') {
        e.preventDefault();
        sendRealTimeMessage();
    }
});

// Funciones expuestas globalmente para los onclick del HTML
window.toggleModule = toggleModule;
window.openChatbot = openChatbot;
window.openCotizador = openCotizador;
window.openRealTimeChat = openRealTimeChat;
window.sendRealTimeMessage = sendRealTimeMessage;
window.uploadImage = uploadImage;