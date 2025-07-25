// Configuración de Firebase para ElectriServ Chile
// Este archivo contiene la configuración y funciones para Firebase Authentication

// Configuración de Firebase (usar variables de entorno en producción)
const firebaseConfig = {
    // Configuración de ejemplo - Reemplazar con datos reales del proyecto Firebase
    apiKey: "AIzaSyDemoKey-ElectriServ-Chile",
    authDomain: "electriserv-chile.firebaseapp.com",
    projectId: "electriserv-chile",
    storageBucket: "electriserv-chile.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456789"
};

// Variables globales de Firebase
let firebaseApp = null;
let firebaseAuth = null;
let firebaseDb = null;

// Estado de inicialización
let isFirebaseInitialized = false;

// Inicializar Firebase
async function initializeFirebase() {
    try {
        // Verificar si Firebase SDK está disponible
        if (typeof firebase === 'undefined') {
            console.warn('Firebase SDK no está cargado. Usando modo simulación.');
            initializeFirebaseSimulation();
            return;
        }

        // Inicializar Firebase
        firebaseApp = firebase.initializeApp(firebaseConfig);
        firebaseAuth = firebase.auth();
        firebaseDb = firebase.firestore();

        // Configurar idioma en español
        firebaseAuth.languageCode = 'es';

        // Listener para cambios de autenticación
        firebaseAuth.onAuthStateChanged(handleAuthStateChange);

        isFirebaseInitialized = true;
        console.log('Firebase inicializado correctamente');

        // Configurar proveedores de autenticación adicionales
        setupAuthProviders();

    } catch (error) {
        console.error('Error al inicializar Firebase:', error);
        // Fallback a modo simulación
        initializeFirebaseSimulation();
    }
}

// Modo simulación para desarrollo (cuando Firebase no está disponible)
function initializeFirebaseSimulation() {
    console.log('Iniciando modo simulación de Firebase');
    
    // Crear objeto simulado para desarrollo
    window.firebaseSimulation = {
        auth: {
            currentUser: null,
            onAuthStateChanged: (callback) => {
                console.log('Auth state listener registrado (simulación)');
                // Simular usuario existente si hay datos en localStorage
                const savedUser = localStorage.getItem('firebaseSimUser');
                if (savedUser) {
                    setTimeout(() => callback(JSON.parse(savedUser)), 100);
                }
            },
            signInWithEmailAndPassword: async (email, password) => {
                return simulateAuthOperation('signIn', { email, password });
            },
            createUserWithEmailAndPassword: async (email, password) => {
                return simulateAuthOperation('signUp', { email, password });
            },
            signOut: async () => {
                return simulateAuthOperation('signOut');
            },
            sendPasswordResetEmail: async (email) => {
                return simulateAuthOperation('resetPassword', { email });
            }
        }
    };

    isFirebaseInitialized = true;
}

// Simular operaciones de autenticación
async function simulateAuthOperation(operation, data = {}) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            try {
                switch (operation) {
                    case 'signIn':
                        if (data.email && data.password.length >= 6) {
                            const user = {
                                uid: 'firebase-sim-' + Date.now(),
                                email: data.email,
                                displayName: data.email.split('@')[0],
                                emailVerified: true
                            };
                            localStorage.setItem('firebaseSimUser', JSON.stringify(user));
                            resolve({ user });
                        } else {
                            reject(new Error('Credenciales inválidas'));
                        }
                        break;

                    case 'signUp':
                        if (data.email && data.password.length >= 6) {
                            const user = {
                                uid: 'firebase-sim-new-' + Date.now(),
                                email: data.email,
                                displayName: data.email.split('@')[0],
                                emailVerified: false
                            };
                            localStorage.setItem('firebaseSimUser', JSON.stringify(user));
                            resolve({ user });
                        } else {
                            reject(new Error('Email o contraseña inválidos'));
                        }
                        break;

                    case 'signOut':
                        localStorage.removeItem('firebaseSimUser');
                        resolve();
                        break;

                    case 'resetPassword':
                        if (data.email) {
                            resolve();
                        } else {
                            reject(new Error('Email requerido'));
                        }
                        break;

                    default:
                        reject(new Error('Operación no soportada'));
                }
            } catch (error) {
                reject(error);
            }
        }, 1000 + Math.random() * 1000); // Simular latencia de red
    });
}

// Configurar proveedores de autenticación
function setupAuthProviders() {
    if (!isFirebaseInitialized || !firebaseAuth) return;

    try {
        // Configurar proveedor de Google (opcional)
        if (firebase.auth.GoogleAuthProvider) {
            const googleProvider = new firebase.auth.GoogleAuthProvider();
            googleProvider.addScope('email');
            googleProvider.addScope('profile');
        }

        // Configurar proveedor de Facebook (opcional)
        if (firebase.auth.FacebookAuthProvider) {
            const facebookProvider = new firebase.auth.FacebookAuthProvider();
            facebookProvider.addScope('email');
        }

    } catch (error) {
        console.warn('Error configurando proveedores de auth:', error);
    }
}

// Manejar cambios en el estado de autenticación
function handleAuthStateChange(user) {
    if (user) {
        // Usuario autenticado
        console.log('Usuario autenticado:', user.email);
        
        const userData = {
            id: user.uid,
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
            emailVerified: user.emailVerified,
            type: 'cliente', // Por defecto
            authMethod: 'firebase'
        };

        // Actualizar estado global
        if (typeof authenticateUser === 'function') {
            authenticateUser(userData);
        }

        // Guardar datos del usuario en Firestore (si está disponible)
        saveUserToFirestore(userData);

    } else {
        // Usuario no autenticado
        console.log('Usuario no autenticado');
        
        if (typeof logout === 'function') {
            // No llamar logout() aquí para evitar loops
            currentUser = null;
            isAuthenticated = false;
            localStorage.removeItem('currentUser');
        }
    }
}

// Guardar datos del usuario en Firestore
async function saveUserToFirestore(userData) {
    if (!firebaseDb) return;

    try {
        const userRef = firebaseDb.collection('users').doc(userData.id);
        const userDoc = await userRef.get();

        if (!userDoc.exists) {
            // Crear nuevo documento de usuario
            await userRef.set({
                ...userData,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        } else {
            // Actualizar último login
            await userRef.update({
                lastLogin: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
    } catch (error) {
        console.error('Error guardando usuario en Firestore:', error);
    }
}

// Funciones de autenticación

// Registrar nuevo usuario
async function registerWithEmail(email, password, additionalData = {}) {
    try {
        if (firebaseAuth) {
            const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            
            // Actualizar perfil del usuario
            if (additionalData.displayName) {
                await result.user.updateProfile({
                    displayName: additionalData.displayName
                });
            }

            // Enviar email de verificación
            if (!result.user.emailVerified) {
                await result.user.sendEmailVerification();
                showMessage('Se ha enviado un email de verificación a tu correo', 'info');
            }

            return result;
        } else if (window.firebaseSimulation) {
            return await window.firebaseSimulation.auth.createUserWithEmailAndPassword(email, password);
        }
    } catch (error) {
        console.error('Error en registro:', error);
        throw new Error(getFirebaseErrorMessage(error));
    }
}

// Iniciar sesión con email
async function signInWithEmail(email, password) {
    try {
        if (firebaseAuth) {
            const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
            return result;
        } else if (window.firebaseSimulation) {
            return await window.firebaseSimulation.auth.signInWithEmailAndPassword(email, password);
        }
    } catch (error) {
        console.error('Error en login:', error);
        throw new Error(getFirebaseErrorMessage(error));
    }
}

// Cerrar sesión
async function signOutFirebase() {
    try {
        if (firebaseAuth) {
            await firebaseAuth.signOut();
        } else if (window.firebaseSimulation) {
            await window.firebaseSimulation.auth.signOut();
        }
        
        // Limpiar estado local
        if (typeof logout === 'function') {
            logout();
        }
    } catch (error) {
        console.error('Error cerrando sesión:', error);
        throw error;
    }
}

// Restablecer contraseña
async function resetPassword(email) {
    try {
        if (firebaseAuth) {
            await firebaseAuth.sendPasswordResetEmail(email);
        } else if (window.firebaseSimulation) {
            await window.firebaseSimulation.auth.sendPasswordResetEmail(email);
        }
        
        showMessage('Se ha enviado un email para restablecer tu contraseña', 'success');
    } catch (error) {
        console.error('Error restableciendo contraseña:', error);
        throw new Error(getFirebaseErrorMessage(error));
    }
}

// Obtener usuario actual
function getCurrentUser() {
    if (firebaseAuth) {
        return firebaseAuth.currentUser;
    } else if (window.firebaseSimulation) {
        const savedUser = localStorage.getItem('firebaseSimUser');
        return savedUser ? JSON.parse(savedUser) : null;
    }
    return null;
}

// Verificar si el usuario está autenticado
function isUserAuthenticated() {
    return getCurrentUser() !== null;
}

// Obtener mensajes de error en español
function getFirebaseErrorMessage(error) {
    const errorMessages = {
        'auth/user-not-found': 'No existe una cuenta con este email',
        'auth/wrong-password': 'Contraseña incorrecta',
        'auth/email-already-in-use': 'Este email ya está registrado',
        'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
        'auth/invalid-email': 'Email inválido',
        'auth/user-disabled': 'Esta cuenta ha sido deshabilitada',
        'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
        'auth/network-request-failed': 'Error de conexión. Verifica tu internet',
        'auth/requires-recent-login': 'Necesitas iniciar sesión nuevamente'
    };

    const errorCode = error.code || error.message;
    return errorMessages[errorCode] || 'Error de autenticación: ' + (error.message || 'Error desconocido');
}

// Funciones de utilidad para el frontend

// Mostrar formulario de registro
function showRegisterForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.innerHTML = `
            <h3>Crear Cuenta</h3>
            <input type="text" id="regDisplayName" placeholder="Nombre completo" required>
            <input type="email" id="regEmail" placeholder="Email" required>
            <input type="password" id="regPassword" placeholder="Contraseña (mín. 6 caracteres)" required>
            <input type="password" id="regConfirmPassword" placeholder="Confirmar contraseña" required>
            <button type="submit" class="btn-primary">Crear Cuenta</button>
            <button type="button" onclick="showLoginForm()" class="btn-secondary">Volver al Login</button>
        `;
        
        loginForm.onsubmit = handleRegisterSubmit;
    }
}

// Mostrar formulario de login
function showLoginForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.innerHTML = `
            <input type="email" id="loginEmail" placeholder="Email" required>
            <input type="password" id="loginPassword" placeholder="Contraseña" required>
            <button type="submit" class="btn-primary">Iniciar Sesión</button>
            <button type="button" onclick="showRegisterForm()" class="btn-secondary">Crear Cuenta</button>
            <button type="button" onclick="showResetPasswordForm()" class="btn-link">¿Olvidaste tu contraseña?</button>
        `;
        
        loginForm.onsubmit = handleLoginSubmit;
    }
}

// Mostrar formulario de recuperación de contraseña
function showResetPasswordForm() {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.innerHTML = `
            <h3>Recuperar Contraseña</h3>
            <input type="email" id="resetEmail" placeholder="Tu email" required>
            <button type="submit" class="btn-primary">Enviar Email</button>
            <button type="button" onclick="showLoginForm()" class="btn-secondary">Volver al Login</button>
        `;
        
        loginForm.onsubmit = handleResetPasswordSubmit;
    }
}

// Manejar envío de formulario de registro
async function handleRegisterSubmit(e) {
    e.preventDefault();
    
    const displayName = document.getElementById('regDisplayName').value;
    const email = document.getElementById('regEmail').value;
    const password = document.getElementById('regPassword').value;
    const confirmPassword = document.getElementById('regConfirmPassword').value;

    if (password !== confirmPassword) {
        showMessage('Las contraseñas no coinciden', 'error');
        return;
    }

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span>Creando cuenta...';
    submitBtn.disabled = true;

    try {
        await registerWithEmail(email, password, { displayName });
        showMessage('Cuenta creada exitosamente', 'success');
        closeModal();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Manejar envío de formulario de login
async function handleLoginSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span>Iniciando sesión...';
    submitBtn.disabled = true;

    try {
        await signInWithEmail(email, password);
        showMessage('Sesión iniciada correctamente', 'success');
        closeModal();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Manejar envío de formulario de recuperación
async function handleResetPasswordSubmit(e) {
    e.preventDefault();
    
    const email = document.getElementById('resetEmail').value;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.innerHTML = '<span class="spinner"></span>Enviando...';
    submitBtn.disabled = true;

    try {
        await resetPassword(email);
        showLoginForm();
    } catch (error) {
        showMessage(error.message, 'error');
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Inicializar Firebase cuando se carga el DOM
document.addEventListener('DOMContentLoaded', function() {
    initializeFirebase();
});

// Exportar funciones para uso global
window.initializeFirebase = initializeFirebase;
window.signInWithEmail = signInWithEmail;
window.registerWithEmail = registerWithEmail;
window.signOutFirebase = signOutFirebase;
window.resetPassword = resetPassword;
window.getCurrentUser = getCurrentUser;
window.isUserAuthenticated = isUserAuthenticated;
window.showRegisterForm = showRegisterForm;
window.showLoginForm = showLoginForm;
window.showResetPasswordForm = showResetPasswordForm;