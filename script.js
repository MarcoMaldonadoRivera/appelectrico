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
    // Generar cotización en formato HTML elegante
    console.log('Generando cotización HTML para:', cotizacion);
    
    // Crear nueva ventana para la cotización
    const cotizacionWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    
    // Generar HTML de la cotización
    const cotizacionHTML = generateQuoteHTML(cotizacion);
    
    // Escribir el HTML en la nueva ventana
    cotizacionWindow.document.write(cotizacionHTML);
    cotizacionWindow.document.close();
    
    // Enfocar la nueva ventana
    cotizacionWindow.focus();
}

function generateQuoteHTML(cotizacion) {
    const fechaActual = new Date().toLocaleDateString('es-CL', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const fechaVencimiento = new Date();
    fechaVencimiento.setDate(fechaVencimiento.getDate() + 30);
    const fechaVenc = fechaVencimiento.toLocaleDateString('es-CL');
    
    // Calcular costos según el tipo de servicio
    const costos = calculateServiceCosts(cotizacion.servicio, cotizacion.potencia);
    
    return `
<!DOCTYPE html>
<html lang="es-CL">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cotización ElectriServ Chile - ${cotizacion.id}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f8f9fa;
            padding: 20px;
        }
        
        .cotizacion-container {
            max-width: 800px;
            margin: 0 auto;
            background: white;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            border-radius: 12px;
            overflow: hidden;
        }
        
        .header {
            background: linear-gradient(135deg, #2563eb, #1d4ed8);
            color: white;
            padding: 2rem;
            text-align: center;
            position: relative;
        }
        
        .header::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="1"/></pattern></defs><rect width="100" height="100" fill="url(%23grid)"/></svg>');
            opacity: 0.3;
        }
        
        .logo {
            font-size: 2.5rem;
            font-weight: 800;
            margin-bottom: 0.5rem;
            position: relative;
            z-index: 1;
        }
        
        .logo i {
            color: #f59e0b;
            margin-right: 0.5rem;
        }
        
        .tagline {
            font-size: 1.1rem;
            opacity: 0.9;
            position: relative;
            z-index: 1;
        }
        
        .content {
            padding: 2rem;
        }
        
        .cotizacion-info {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 2rem;
            margin-bottom: 2rem;
            padding: 1.5rem;
            background: #f8f9fa;
            border-radius: 8px;
            border-left: 4px solid #2563eb;
        }
        
        .info-section h3 {
            color: #2563eb;
            margin-bottom: 1rem;
            font-size: 1.1rem;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        
        .info-item {
            margin-bottom: 0.75rem;
            display: flex;
            align-items: center;
        }
        
        .info-label {
            font-weight: 600;
            color: #6b7280;
            min-width: 120px;
        }
        
        .info-value {
            color: #1f2937;
            font-weight: 500;
        }
        
        .servicios-table {
            width: 100%;
            border-collapse: collapse;
            margin: 2rem 0;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .servicios-table th {
            background: #2563eb;
            color: white;
            padding: 1rem;
            text-align: left;
            font-weight: 600;
        }
        
        .servicios-table td {
            padding: 1rem;
            border-bottom: 1px solid #e5e7eb;
        }
        
        .servicios-table tr:hover {
            background: #f8f9fa;
        }
        
        .precio {
            font-weight: 700;
            color: #059669;
            font-size: 1.1rem;
        }
        
        .total-section {
            background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
            padding: 1.5rem;
            border-radius: 8px;
            margin: 2rem 0;
            border: 2px solid #2563eb;
        }
        
        .total-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.5rem;
        }
        
        .total-row.final {
            font-size: 1.3rem;
            font-weight: 800;
            color: #2563eb;
            border-top: 2px solid #2563eb;
            padding-top: 1rem;
            margin-top: 1rem;
        }
        
        .normativas-section {
            background: #fef3cd;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 1.5rem;
            margin: 2rem 0;
        }
        
        .normativas-section h3 {
            color: #92400e;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .normativas-list {
            list-style: none;
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 0.5rem;
        }
        
        .normativas-list li {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: #92400e;
        }
        
        .normativas-list li::before {
            content: '✓';
            background: #059669;
            color: white;
            border-radius: 50%;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.8rem;
            font-weight: bold;
        }
        
        .footer {
            background: #1f2937;
            color: white;
            padding: 2rem;
            text-align: center;
        }
        
        .footer-content {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 1rem;
        }
        
        .footer h4 {
            color: #f59e0b;
            margin-bottom: 0.5rem;
        }
        
        .print-section {
            text-align: center;
            padding: 2rem;
            background: white;
            border-top: 1px solid #e5e7eb;
        }
        
        .btn-print {
            background: linear-gradient(135deg, #059669, #047857);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            margin: 0 0.5rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .btn-print:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        .btn-download {
            background: linear-gradient(135deg, #7c3aed, #6d28d9);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 8px;
            font-size: 1.1rem;
            font-weight: 600;
            cursor: pointer;
            margin: 0 0.5rem;
            transition: all 0.3s ease;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        
        .btn-download:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 12px rgba(0,0,0,0.15);
        }
        
        @media print {
            body {
                background: white;
                padding: 0;
            }
            
            .print-section {
                display: none;
            }
            
            .cotizacion-container {
                box-shadow: none;
                border-radius: 0;
            }
        }
        
        @media (max-width: 768px) {
            .cotizacion-info {
                grid-template-columns: 1fr;
                gap: 1rem;
            }
            
            .servicios-table {
                font-size: 0.9rem;
            }
            
            .servicios-table th,
            .servicios-table td {
                padding: 0.75rem 0.5rem;
            }
            
            .normativas-list {
                grid-template-columns: 1fr;
            }
            
            .footer-content {
                grid-template-columns: 1fr;
                text-align: left;
            }
        }
        
        .validity-notice {
            background: #dbeafe;
            border: 1px solid #3b82f6;
            border-radius: 8px;
            padding: 1rem;
            margin: 1.5rem 0;
            text-align: center;
        }
        
        .validity-notice strong {
            color: #1e40af;
        }
    </style>
</head>
<body>
    <div class="cotizacion-container">
        <div class="header">
            <div class="logo">
                <i class="fas fa-bolt"></i>
                ElectriServ Chile
            </div>
            <div class="tagline">Servicios Eléctricos Certificados SEC</div>
        </div>
        
        <div class="content">
            <div class="cotizacion-info">
                <div class="info-section">
                    <h3>Información de la Cotización</h3>
                    <div class="info-item">
                        <span class="info-label">N° Cotización:</span>
                        <span class="info-value">#${cotizacion.id.toUpperCase()}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fecha:</span>
                        <span class="info-value">${fechaActual}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Válida hasta:</span>
                        <span class="info-value">${fechaVenc}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Estado:</span>
                        <span class="info-value" style="color: #059669; font-weight: 600;">VIGENTE</span>
                    </div>
                </div>
                
                <div class="info-section">
                    <h3>Datos del Cliente</h3>
                    <div class="info-item">
                        <span class="info-label">Nombre:</span>
                        <span class="info-value">${cotizacion.cliente.name}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${cotizacion.cliente.email}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Dirección:</span>
                        <span class="info-value">${cotizacion.direccion}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Potencia:</span>
                        <span class="info-value">${cotizacion.potencia} kW</span>
                    </div>
                </div>
            </div>
            
            <table class="servicios-table">
                <thead>
                    <tr>
                        <th>Descripción del Servicio</th>
                        <th>Cantidad</th>
                        <th>Precio Unitario</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <strong>${getServiceTitle(cotizacion.servicio)}</strong><br>
                            <small style="color: #6b7280;">${getServiceDescription(cotizacion.servicio, cotizacion.potencia)}</small>
                        </td>
                        <td>1</td>
                        <td class="precio">$${costos.servicioBase.toLocaleString('es-CL')}</td>
                        <td class="precio">$${costos.servicioBase.toLocaleString('es-CL')}</td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Materiales y Componentes</strong><br>
                            <small style="color: #6b7280;">Incluye medidor, tablero, protecciones y cableado</small>
                        </td>
                        <td>1 kit</td>
                        <td class="precio">$${costos.materiales.toLocaleString('es-CL')}</td>
                        <td class="precio">$${costos.materiales.toLocaleString('es-CL')}</td>
                    </tr>
                    <tr>
                        <td>
                            <strong>Tramitación SEC</strong><br>
                            <small style="color: #6b7280;">Gestión documentaria y permisos</small>
                        </td>
                        <td>1</td>
                        <td class="precio">$${costos.tramites.toLocaleString('es-CL')}</td>
                        <td class="precio">$${costos.tramites.toLocaleString('es-CL')}</td>
                    </tr>
                    ${cotizacion.descripcion ? `
                    <tr>
                        <td>
                            <strong>Trabajos Adicionales</strong><br>
                            <small style="color: #6b7280;">${cotizacion.descripcion}</small>
                        </td>
                        <td>1</td>
                        <td class="precio">$${costos.adicionales.toLocaleString('es-CL')}</td>
                        <td class="precio">$${costos.adicionales.toLocaleString('es-CL')}</td>
                    </tr>
                    ` : ''}
                </tbody>
            </table>
            
            <div class="total-section">
                <div class="total-row">
                    <span>Subtotal:</span>
                    <span class="precio">$${costos.subtotal.toLocaleString('es-CL')}</span>
                </div>
                <div class="total-row">
                    <span>IVA (19%):</span>
                    <span class="precio">$${costos.iva.toLocaleString('es-CL')}</span>
                </div>
                <div class="total-row final">
                    <span>TOTAL:</span>
                    <span>$${costos.total.toLocaleString('es-CL')}</span>
                </div>
            </div>
            
            <div class="validity-notice">
                <strong>Validez de la cotización:</strong> 30 días desde la fecha de emisión.<br>
                <strong>Forma de pago:</strong> 50% al iniciar trabajos, 50% al finalizar y aprobar por SEC.
            </div>
            
            <div class="normativas-section">
                <h3>
                    <i class="fas fa-certificate"></i>
                    Cumplimiento Normativo SEC
                </h3>
                <ul class="normativas-list">
                    <li>DS 8 - Reglamento de Servicios Eléctricos</li>
                    <li>RIC 1-19 - Instalaciones de Corrientes Fuertes</li>
                    <li>Técnico TE1/TC6 Certificado</li>
                    <li>Registro e-RNII Vigente</li>
                    <li>Garantía de 2 años en trabajos</li>
                    <li>Inspección SEC incluida</li>
                </ul>
            </div>
        </div>
        
        <div class="footer">
            <div class="footer-content">
                <div>
                    <h4>ElectriServ Chile</h4>
                    <p>Servicios eléctricos profesionales<br>RUT: 76.XXX.XXX-X</p>
                </div>
                <div>
                    <h4>Contacto</h4>
                    <p>📞 +56 2 2XXX XXXX<br>📧 info@electriserv.cl</p>
                </div>
                <div>
                    <h4>Dirección</h4>
                    <p>Av. Providencia 1234<br>Santiago, Chile</p>
                </div>
            </div>
            <p style="margin-top: 1rem; opacity: 0.8;">
                Cotización generada automáticamente por ElectriServ Chile
            </p>
        </div>
    </div>
    
    <div class="print-section">
        <button class="btn-print" onclick="window.print()">
            <i class="fas fa-print"></i> Imprimir Cotización
        </button>
        <button class="btn-download" onclick="downloadHTML()">
            <i class="fas fa-download"></i> Descargar HTML
        </button>
    </div>
    
    <script>
        function downloadHTML() {
            const htmlContent = document.documentElement.outerHTML;
            const blob = new Blob([htmlContent], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'cotizacion_${cotizacion.id}.html';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
        
        // Auto-focus para impresión
        window.addEventListener('load', function() {
            document.title = 'Cotización ${cotizacion.id} - ElectriServ Chile';
        });
    </script>
</body>
</html>`;
}

function calculateServiceCosts(tipoServicio, potencia) {
    let servicioBase = 0;
    let materiales = 0;
    let tramites = 45000; // Costo fijo SEC
    let adicionales = 0;
    
    const potenciaNum = parseInt(potencia) || 5;
    
    // Calcular costos según tipo de servicio y potencia
    switch(tipoServicio) {
        case 'empalme-nuevo':
            if (potenciaNum <= 5) {
                servicioBase = 150000; // Monofásico
                materiales = 80000;
            } else if (potenciaNum <= 10) {
                servicioBase = 250000; // Bifásico
                materiales = 120000;
            } else {
                servicioBase = 350000; // Trifásico
                materiales = 180000;
            }
            break;
        case 'ampliacion':
            servicioBase = 120000;
            materiales = 60000 + (potenciaNum * 8000);
            break;
        case 'reparacion':
            servicioBase = 80000;
            materiales = 40000;
            tramites = 25000;
            break;
        case 'mantención':
            servicioBase = 60000;
            materiales = 20000;
            tramites = 15000;
            break;
        default:
            servicioBase = 100000;
            materiales = 50000;
    }
    
    // Trabajos adicionales (estimado)
    adicionales = servicioBase * 0.1;
    
    const subtotal = servicioBase + materiales + tramites + adicionales;
    const iva = subtotal * 0.19;
    const total = subtotal + iva;
    
    return {
        servicioBase,
        materiales,
        tramites,
        adicionales,
        subtotal,
        iva,
        total
    };
}

function getServiceTitle(tipoServicio) {
    const titles = {
        'empalme-nuevo': 'Instalación de Empalme Nuevo',
        'ampliacion': 'Ampliación de Potencia Eléctrica',
        'reparacion': 'Reparación de Instalación Eléctrica',
        'mantención': 'Mantención Preventiva'
    };
    return titles[tipoServicio] || 'Servicio Eléctrico';
}

function getServiceDescription(tipoServicio, potencia) {
    const potenciaNum = parseInt(potencia) || 5;
    let tipo = 'monofásico';
    
    if (potenciaNum > 10) tipo = 'trifásico';
    else if (potenciaNum > 5) tipo = 'bifásico';
    
    const descriptions = {
        'empalme-nuevo': `Instalación completa de empalme ${tipo} para ${potencia} kW, incluye medidor, tablero principal y conexión a red`,
        'ampliacion': `Ampliación de capacidad eléctrica a ${potencia} kW, modificación de tablero y actualización de protecciones`,
        'reparacion': `Diagnóstico y reparación de fallas eléctricas, verificación de cumplimiento normativo`,
        'mantención': `Inspección general, limpieza de contactos, verificación de protecciones y conexiones`
    };
    return descriptions[tipoServicio] || `Servicio eléctrico para instalación de ${potencia} kW`;
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

// ========================================
// SISTEMA DE ADMINISTRACIÓN TI
// ========================================

// Variables globales del administrador
let isAdminAuthenticated = false;
let currentAdmin = null;
let adminCredentials = {
    username: 'root',
    password: 'root'
};

// Abrir panel de administración
function openAdminPanel() {
    openModal('adminLoginModal');
    
    // Setup del formulario de login de admin
    const adminLoginForm = document.getElementById('adminLoginForm');
    if (adminLoginForm) {
        adminLoginForm.onsubmit = handleAdminLogin;
    }
}

// Manejar login de administrador
function handleAdminLogin(e) {
    e.preventDefault();
    
    const username = document.getElementById('adminUsername').value;
    const password = document.getElementById('adminPassword').value;
    
    if (username === adminCredentials.username && password === adminCredentials.password) {
        // Login exitoso
        currentAdmin = {
            username: username,
            loginTime: new Date().toISOString(),
            permissions: ['users', 'settings', 'reports']
        };
        
        isAdminAuthenticated = true;
        
        // Cerrar modal de login y abrir panel
        closeModal();
        openModal('adminPanelModal');
        
        // Inicializar panel de administración
        initializeAdminPanel();
        
        showMessage('Acceso de administrador concedido', 'success');
    } else {
        showMessage('Credenciales de administrador incorrectas', 'error');
    }
}

// Inicializar panel de administración
function initializeAdminPanel() {
    if (!isAdminAuthenticated) return;
    
    // Actualizar nombre del admin en la UI
    const adminNameElement = document.getElementById('currentAdminName');
    if (adminNameElement) {
        adminNameElement.textContent = currentAdmin.username;
    }
    
    // Cargar datos iniciales
    loadUsersList();
    updateAdminStats();
    setupAdminEventListeners();
    
    // Mostrar primera tab
    showAdminTab('users');
}

// Configurar event listeners del panel de admin
function setupAdminEventListeners() {
    // Formulario de nuevo usuario
    const newUserForm = document.getElementById('newUserForm');
    if (newUserForm) {
        newUserForm.onsubmit = handleCreateUser;
        
        // Mostrar/ocultar certificación según tipo de usuario
        const userTypeSelect = newUserForm.querySelector('select[name="userType"]');
        const certificacionGroup = document.getElementById('certificacionGroup');
        
        if (userTypeSelect && certificacionGroup) {
            userTypeSelect.addEventListener('change', function() {
                if (this.value === 'tecnico') {
                    certificacionGroup.style.display = 'block';
                    certificacionGroup.querySelector('select').required = true;
                } else {
                    certificacionGroup.style.display = 'none';
                    certificacionGroup.querySelector('select').required = false;
                }
            });
        }
    }
    
    // Formulario de cambio de contraseña
    const changePasswordForm = document.getElementById('changePasswordForm');
    if (changePasswordForm) {
        changePasswordForm.onsubmit = handleChangeAdminPassword;
    }
}

// Cambiar tab del panel de admin
function showAdminTab(tabName) {
    // Ocultar todas las tabs
    const tabContents = document.querySelectorAll('.admin-tab-content');
    const tabButtons = document.querySelectorAll('.admin-tab');
    
    tabContents.forEach(tab => tab.classList.remove('active'));
    tabButtons.forEach(btn => btn.classList.remove('active'));
    
    // Mostrar tab seleccionada
    const targetTab = document.getElementById(`admin-${tabName}-tab`);
    const targetButton = document.querySelector(`[onclick="showAdminTab('${tabName}')"]`);
    
    if (targetTab) targetTab.classList.add('active');
    if (targetButton) targetButton.classList.add('active');
    
    // Cargar datos específicos de la tab
    switch(tabName) {
        case 'users':
            loadUsersList();
            break;
        case 'settings':
            updateAdminStats();
            break;
        case 'reports':
            generateReports();
            break;
    }
}

// Cargar lista de usuarios
function loadUsersList() {
    const usersTableBody = document.getElementById('usersTableBody');
    if (!usersTableBody) return;
    
    // Obtener usuarios del localStorage (simula base de datos)
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    
    // Agregar algunos usuarios de ejemplo si no hay ninguno
    if (users.length === 0) {
        const exampleUsers = [
            {
                id: 'usr001',
                fullName: 'Juan Pérez González',
                email: 'juan.perez@email.com',
                rut: '12.345.678-9',
                userType: 'cliente',
                phone: '+56 9 8765 4321',
                status: 'active',
                createdAt: new Date('2024-01-15').toISOString()
            },
            {
                id: 'usr002',
                fullName: 'María Rodriguez Silva',
                email: 'maria.rodriguez@email.com',
                rut: '98.765.432-1',
                userType: 'tecnico',
                certificacion: 'TE1',
                phone: '+56 9 1234 5678',
                status: 'active',
                createdAt: new Date('2024-01-10').toISOString()
            },
            {
                id: 'usr003',
                fullName: 'Carlos López Martínez',
                email: 'carlos.lopez@email.com',
                rut: '11.222.333-4',
                userType: 'tecnico',
                certificacion: 'TC6',
                phone: '+56 9 9876 5432',
                status: 'active',
                createdAt: new Date('2024-01-05').toISOString()
            }
        ];
        
        localStorage.setItem('systemUsers', JSON.stringify(exampleUsers));
        users.push(...exampleUsers);
    }
    
    // Generar HTML de la tabla
    usersTableBody.innerHTML = users.map(user => `
        <tr>
            <td>${user.id}</td>
            <td>${user.fullName}</td>
            <td>${user.email}</td>
            <td>${user.rut}</td>
            <td>
                <span class="user-type ${user.userType}">${user.userType.charAt(0).toUpperCase() + user.userType.slice(1)}</span>
            </td>
            <td>${user.certificacion || '-'}</td>
            <td>
                <span class="user-status ${user.status}">${user.status === 'active' ? 'Activo' : 'Inactivo'}</span>
            </td>
            <td>${new Date(user.createdAt).toLocaleDateString('es-CL')}</td>
            <td>
                <div class="user-actions">
                    <button class="btn-action btn-edit" onclick="editUser('${user.id}')" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn-action btn-toggle" onclick="toggleUserStatus('${user.id}')" title="${user.status === 'active' ? 'Desactivar' : 'Activar'}">
                        <i class="fas fa-${user.status === 'active' ? 'pause' : 'play'}"></i>
                    </button>
                    <button class="btn-action btn-delete" onclick="deleteUser('${user.id}')" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
}

// Mostrar formulario de agregar usuario
function showAddUserForm() {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.classList.remove('hidden');
        addUserForm.scrollIntoView({ behavior: 'smooth' });
    }
}

// Ocultar formulario de agregar usuario
function hideAddUserForm() {
    const addUserForm = document.getElementById('addUserForm');
    if (addUserForm) {
        addUserForm.classList.add('hidden');
        // Limpiar formulario
        document.getElementById('newUserForm').reset();
        document.getElementById('certificacionGroup').style.display = 'none';
    }
}

// Manejar creación de nuevo usuario
function handleCreateUser(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const userData = {
        id: 'usr' + Date.now().toString().slice(-6),
        fullName: formData.get('fullName'),
        email: formData.get('email'),
        rut: formData.get('rut'),
        userType: formData.get('userType'),
        certificacion: formData.get('certificacion') || null,
        phone: formData.get('phone'),
        status: 'active',
        createdAt: new Date().toISOString(),
        createdBy: currentAdmin.username
    };
    
    // Validaciones
    if (!userData.fullName || !userData.email || !userData.rut) {
        showMessage('Por favor complete todos los campos obligatorios', 'error');
        return;
    }
    
    if (userData.userType === 'tecnico' && !userData.certificacion) {
        showMessage('Los técnicos deben tener una certificación', 'error');
        return;
    }
    
    // Verificar email único
    const existingUsers = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    if (existingUsers.find(user => user.email === userData.email)) {
        showMessage('Ya existe un usuario con este email', 'error');
        return;
    }
    
    // Agregar usuario
    existingUsers.push(userData);
    localStorage.setItem('systemUsers', JSON.stringify(existingUsers));
    
    // Actualizar UI
    loadUsersList();
    updateAdminStats();
    hideAddUserForm();
    
    showMessage(`Usuario ${userData.fullName} creado exitosamente`, 'success');
}

// Alternar estado de usuario
function toggleUserStatus(userId) {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
        const newStatus = users[userIndex].status === 'active' ? 'inactive' : 'active';
        users[userIndex].status = newStatus;
        users[userIndex].lastModified = new Date().toISOString();
        users[userIndex].modifiedBy = currentAdmin.username;
        
        localStorage.setItem('systemUsers', JSON.stringify(users));
        loadUsersList();
        updateAdminStats();
        
        const action = newStatus === 'active' ? 'activado' : 'desactivado';
        showMessage(`Usuario ${action} correctamente`, 'success');
    }
}

// Eliminar usuario
function deleteUser(userId) {
    if (!confirm('¿Está seguro de que desea eliminar este usuario? Esta acción no se puede deshacer.')) {
        return;
    }
    
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex !== -1) {
        const deletedUser = users[userIndex];
        users.splice(userIndex, 1);
        
        localStorage.setItem('systemUsers', JSON.stringify(users));
        loadUsersList();
        updateAdminStats();
        
        showMessage(`Usuario ${deletedUser.fullName} eliminado correctamente`, 'success');
    }
}

// Editar usuario (función básica)
function editUser(userId) {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    const user = users.find(user => user.id === userId);
    
    if (user) {
        // Por simplicidad, mostrar datos en un prompt
        const newName = prompt('Nuevo nombre:', user.fullName);
        const newPhone = prompt('Nuevo teléfono:', user.phone || '');
        
        if (newName && newName !== user.fullName) {
            user.fullName = newName;
            user.lastModified = new Date().toISOString();
            user.modifiedBy = currentAdmin.username;
            
            localStorage.setItem('systemUsers', JSON.stringify(users));
            loadUsersList();
            
            showMessage('Usuario actualizado correctamente', 'success');
        }
        
        if (newPhone && newPhone !== user.phone) {
            user.phone = newPhone;
            localStorage.setItem('systemUsers', JSON.stringify(users));
            loadUsersList();
        }
    }
}

// Actualizar estadísticas del admin
function updateAdminStats() {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    
    const stats = {
        total: users.length,
        active: users.filter(u => u.status === 'active').length,
        te1: users.filter(u => u.certificacion === 'TE1').length,
        tc6: users.filter(u => u.certificacion === 'TC6').length
    };
    
    // Actualizar elementos de la UI
    const elements = {
        totalUsers: document.getElementById('totalUsers'),
        activeUsers: document.getElementById('activeUsers'),
        te1Users: document.getElementById('te1Users'),
        tc6Users: document.getElementById('tc6Users')
    };
    
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            const statKey = key.replace('Users', '').toLowerCase();
            elements[key].textContent = stats[statKey] || 0;
        }
    });
}

// Refrescar lista de usuarios
function refreshUsersList() {
    loadUsersList();
    updateAdminStats();
    showMessage('Lista de usuarios actualizada', 'info');
}

// Manejar cambio de contraseña de admin
function handleChangeAdminPassword(e) {
    e.preventDefault();
    
    const currentPassword = document.getElementById('currentPassword').value;
    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validaciones
    if (currentPassword !== adminCredentials.password) {
        showMessage('La contraseña actual es incorrecta', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showMessage('Las nuevas contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showMessage('La nueva contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Cambiar contraseña
    adminCredentials.password = newPassword;
    
    // En un sistema real, esto se guardaría en la base de datos encriptado
    localStorage.setItem('adminCredentials', JSON.stringify(adminCredentials));
    
    // Limpiar formulario
    e.target.reset();
    
    showMessage('Contraseña de administrador cambiada exitosamente', 'success');
}

// Exportar datos de usuarios
function exportUsersData() {
    const users = JSON.parse(localStorage.getItem('systemUsers') || '[]');
    
    const csvContent = [
        'ID,Nombre,Email,RUT,Tipo,Certificación,Estado,Fecha Registro',
        ...users.map(user => [
            user.id,
            user.fullName,
            user.email,
            user.rut,
            user.userType,
            user.certificacion || '',
            user.status,
            new Date(user.createdAt).toLocaleDateString('es-CL')
        ].join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `usuarios_electriserv_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showMessage('Datos de usuarios exportados correctamente', 'success');
}

// Generar reportes (función básica)
function generateReports() {
    // Esta función podría implementar gráficos reales con Chart.js
    showMessage('Generando reportes...', 'info');
    
    setTimeout(() => {
        showMessage('Reportes generados correctamente', 'success');
    }, 1000);
}

// Cerrar sesión de administrador
function logoutAdmin() {
    currentAdmin = null;
    isAdminAuthenticated = false;
    closeModal();
    showMessage('Sesión de administrador cerrada', 'info');
}

// Funciones expuestas globalmente para los onclick del HTML
window.toggleModule = toggleModule;
window.openChatbot = openChatbot;
window.openCotizador = openCotizador;
window.openRealTimeChat = openRealTimeChat;
window.sendRealTimeMessage = sendRealTimeMessage;
window.uploadImage = uploadImage;

// Funciones de administración expuestas globalmente
window.openAdminPanel = openAdminPanel;
window.showAdminTab = showAdminTab;
window.showAddUserForm = showAddUserForm;
window.hideAddUserForm = hideAddUserForm;
window.refreshUsersList = refreshUsersList;
window.toggleUserStatus = toggleUserStatus;
window.deleteUser = deleteUser;
window.editUser = editUser;
window.exportUsersData = exportUsersData;
window.logoutAdmin = logoutAdmin;