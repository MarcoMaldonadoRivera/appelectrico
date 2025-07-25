const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { generateToken, authMiddleware } = require('../middleware/auth');
const { asyncHandler, createError } = require('../middleware/errorHandler');
const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Registrar nuevo usuario (cliente o técnico)
 * @access  Public
 */
router.post('/register', [
  // Validaciones
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El nombre debe tener entre 2 y 50 caracteres'),
  
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('El apellido debe tener entre 2 y 50 caracteres'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número'),
  
  body('rut')
    .matches(/^[0-9]+[-|‐]{1}[0-9kK]{1}$/)
    .withMessage('Formato de RUT inválido (ej: 12345678-9)'),
  
  body('phone')
    .matches(/^\+?56?[0-9]{8,9}$/)
    .withMessage('Formato de teléfono chileno inválido'),
  
  body('userType')
    .isIn(['cliente', 'tecnico'])
    .withMessage('Tipo de usuario inválido'),
  
  body('address.street')
    .trim()
    .isLength({ min: 5, max: 200 })
    .withMessage('La dirección debe tener entre 5 y 200 caracteres'),
  
  body('address.city')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('La ciudad debe tener entre 2 y 100 caracteres'),
  
  body('address.region')
    .isIn([
      'Arica y Parinacota', 'Tarapacá', 'Antofagasta', 'Atacama',
      'Coquimbo', 'Valparaíso', 'Metropolitana', 'O\'Higgins',
      'Maule', 'Ñuble', 'Biobío', 'La Araucanía', 'Los Ríos',
      'Los Lagos', 'Aysén', 'Magallanes'
    ])
    .withMessage('Región inválida'),

  // Validaciones condicionales para técnicos
  body('secCertification.licenseNumber')
    .if(body('userType').equals('tecnico'))
    .matches(/^SEC-[A-Z0-9]{6,12}$/)
    .withMessage('Formato de licencia SEC inválido'),
  
  body('secCertification.certificationLevel')
    .if(body('userType').equals('tecnico'))
    .isIn(['Instalador Básico', 'Instalador Especialista', 'Instalador Experto'])
    .withMessage('Nivel de certificación inválido'),
  
  body('secCertification.expirationDate')
    .if(body('userType').equals('tecnico'))
    .isISO8601()
    .withMessage('Fecha de expiración inválida')
    .custom((value) => {
      if (new Date(value) <= new Date()) {
        throw new Error('La certificación debe estar vigente');
      }
      return true;
    })

], asyncHandler(async (req, res) => {
  // Verificar errores de validación
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }

  const {
    firstName,
    lastName,
    email,
    password,
    rut,
    phone,
    userType,
    address,
    secCertification
  } = req.body;

  // Verificar si el usuario ya existe
  const existingUser = await User.findOne({
    $or: [{ email }, { rut }]
  });

  if (existingUser) {
    const field = existingUser.email === email ? 'email' : 'RUT';
    throw createError(`Ya existe una cuenta con este ${field}`, 400);
  }

  // Crear nuevo usuario
  const userData = {
    firstName,
    lastName,
    email,
    password,
    rut,
    phone,
    userType,
    address
  };

  // Si es técnico, agregar datos de certificación
  if (userType === 'tecnico' && secCertification) {
    userData.secCertification = {
      ...secCertification,
      verified: false, // Debe ser verificado posteriormente
      ricCertifications: secCertification.ricCertifications || []
    };
  }

  const user = new User(userData);
  await user.save();

  // Si es técnico, iniciar proceso de verificación SEC
  if (userType === 'tecnico') {
    // Aquí se implementaría la integración con API de SEC para verificación
    // Por ahora simulamos el proceso
    console.log(`🔍 Iniciando verificación SEC para usuario ${user._id}`);
  }

  // Generar token
  const token = generateToken(user._id);

  // Respuesta exitosa (sin incluir datos sensibles)
  const userResponse = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    rut: user.rut,
    phone: user.phone,
    userType: user.userType,
    address: user.address,
    isEmailVerified: user.isEmailVerified,
    createdAt: user.createdAt
  };

  // Incluir estado de certificación para técnicos
  if (userType === 'tecnico') {
    userResponse.secCertification = {
      licenseNumber: user.secCertification.licenseNumber,
      certificationLevel: user.secCertification.certificationLevel,
      verified: user.secCertification.verified,
      expirationDate: user.secCertification.expirationDate
    };
  }

  res.status(201).json({
    success: true,
    message: userType === 'tecnico' 
      ? 'Cuenta creada exitosamente. Su certificación SEC será verificada en las próximas 24 horas.'
      : 'Cuenta creada exitosamente',
    data: {
      user: userResponse,
      token
    }
  });
}));

/**
 * @route   POST /api/auth/login
 * @desc    Iniciar sesión
 * @access  Public
 */
router.post('/login', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido'),
  
  body('password')
    .notEmpty()
    .withMessage('Contraseña requerida')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }

  const { email, password } = req.body;

  // Buscar usuario y incluir password para verificación
  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw createError('Credenciales inválidas', 401);
  }

  // Verificar si la cuenta está bloqueada
  if (user.isLocked) {
    await user.incLoginAttempts();
    throw createError('Cuenta temporalmente bloqueada por múltiples intentos fallidos', 423);
  }

  // Verificar contraseña
  const isPasswordValid = await user.comparePassword(password);

  if (!isPasswordValid) {
    await user.incLoginAttempts();
    throw createError('Credenciales inválidas', 401);
  }

  // Verificar si la cuenta está activa
  if (!user.isActive) {
    throw createError('Cuenta desactivada', 401);
  }

  // Para técnicos, verificar certificación SEC
  if (user.userType === 'tecnico') {
    if (!user.secCertification.verified) {
      return res.status(403).json({
        success: false,
        error: 'Certificación SEC pendiente de verificación',
        code: 'CERTIFICATION_PENDING'
      });
    }

    if (user.secCertification.expirationDate < new Date()) {
      return res.status(403).json({
        success: false,
        error: 'Certificación SEC expirada',
        code: 'CERTIFICATION_EXPIRED',
        expirationDate: user.secCertification.expirationDate
      });
    }
  }

  // Reset intentos de login exitoso
  if (user.loginAttempts > 0) {
    await user.updateOne({
      $unset: { loginAttempts: 1, lockUntil: 1 }
    });
  }

  // Actualizar último login
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Generar token
  const token = generateToken(user._id);

  // Respuesta exitosa
  const userResponse = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    rut: user.rut,
    phone: user.phone,
    userType: user.userType,
    address: user.address,
    isEmailVerified: user.isEmailVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt
  };

  if (user.userType === 'tecnico') {
    userResponse.secCertification = {
      licenseNumber: user.secCertification.licenseNumber,
      certificationLevel: user.secCertification.certificationLevel,
      categories: user.secCertification.categories,
      verified: user.secCertification.verified,
      expirationDate: user.secCertification.expirationDate,
      ricCertifications: user.secCertification.ricCertifications
    };
  }

  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    data: {
      user: userResponse,
      token
    }
  });
}));

/**
 * @route   POST /api/auth/clave-unica
 * @desc    Autenticación con ClaveÚnica (integración con ChileAtiende)
 * @access  Public
 */
router.post('/clave-unica', [
  body('authorizationCode')
    .notEmpty()
    .withMessage('Código de autorización requerido'),
  
  body('state')
    .notEmpty()
    .withMessage('State parameter requerido')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos de entrada inválidos',
      details: errors.array()
    });
  }

  const { authorizationCode, state } = req.body;

  try {
    // Aquí se implementaría la integración real con ClaveÚnica
    // Por ahora simulamos el proceso
    const claveUnicaUserData = await simulateClaveUnicaValidation(authorizationCode);

    if (!claveUnicaUserData) {
      throw createError('Error validando con ClaveÚnica', 400);
    }

    // Buscar usuario existente por ClaveÚnica ID o RUT
    let user = await User.findOne({
      $or: [
        { claveUnicaId: claveUnicaUserData.id },
        { rut: claveUnicaUserData.rut }
      ]
    });

    if (user) {
      // Usuario existente - actualizar datos de ClaveÚnica si es necesario
      if (!user.claveUnicaId) {
        user.claveUnicaId = claveUnicaUserData.id;
        user.isEmailVerified = true; // ClaveÚnica verifica la identidad
        await user.save();
      }
    } else {
      // Crear nuevo usuario con datos de ClaveÚnica
      user = new User({
        firstName: claveUnicaUserData.firstName,
        lastName: claveUnicaUserData.lastName,
        email: claveUnicaUserData.email,
        rut: claveUnicaUserData.rut,
        phone: claveUnicaUserData.phone || '',
        userType: 'cliente', // Por defecto cliente, puede cambiarse después
        address: {
          street: claveUnicaUserData.address?.street || '',
          city: claveUnicaUserData.address?.city || '',
          region: claveUnicaUserData.address?.region || 'Metropolitana'
        },
        claveUnicaId: claveUnicaUserData.id,
        isEmailVerified: true,
        isActive: true
      });

      await user.save();
    }

    // Generar token
    const token = generateToken(user._id);

    // Respuesta exitosa
    const userResponse = {
      _id: user._id,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      email: user.email,
      rut: user.rut,
      userType: user.userType,
      isEmailVerified: user.isEmailVerified,
      authMethod: 'ClaveÚnica'
    };

    res.json({
      success: true,
      message: 'Autenticación con ClaveÚnica exitosa',
      data: {
        user: userResponse,
        token
      }
    });

  } catch (error) {
    console.error('Error en autenticación ClaveÚnica:', error);
    throw createError('Error en autenticación con ClaveÚnica', 500);
  }
}));

/**
 * @route   GET /api/auth/me
 * @desc    Obtener información del usuario autenticado
 * @access  Private
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    throw createError('Usuario no encontrado', 404);
  }

  const userResponse = {
    _id: user._id,
    firstName: user.firstName,
    lastName: user.lastName,
    fullName: user.fullName,
    email: user.email,
    rut: user.rut,
    phone: user.phone,
    userType: user.userType,
    address: user.address,
    isEmailVerified: user.isEmailVerified,
    lastLogin: user.lastLogin,
    preferences: user.preferences,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  if (user.userType === 'tecnico') {
    userResponse.secCertification = user.secCertification;
  }

  res.json({
    success: true,
    data: { user: userResponse }
  });
}));

/**
 * @route   POST /api/auth/logout
 * @desc    Cerrar sesión (invalidar token)
 * @access  Private
 */
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  // En una implementación más robusta, se invalidaría el token en una blacklist
  // Por ahora simplemente confirmamos el logout
  
  res.json({
    success: true,
    message: 'Sesión cerrada exitosamente'
  });
}));

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Solicitar restablecimiento de contraseña
 * @access  Public
 */
router.post('/forgot-password', [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Email inválido')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Email inválido',
      details: errors.array()
    });
  }

  const { email } = req.body;

  const user = await User.findOne({ email });

  if (!user) {
    // Por seguridad, responder igual aunque el usuario no exista
    return res.json({
      success: true,
      message: 'Si el email existe, recibirás un enlace de restablecimiento'
    });
  }

  // Generar token de reset
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutos

  await user.save({ validateBeforeSave: false });

  // Aquí se enviaría el email con el enlace de reset
  // Por ahora solo loggeamos el token para desarrollo
  console.log(`🔑 Token de reset para ${email}: ${resetToken}`);

  res.json({
    success: true,
    message: 'Si el email existe, recibirás un enlace de restablecimiento'
  });
}));

/**
 * @route   POST /api/auth/reset-password
 * @desc    Restablecer contraseña
 * @access  Public
 */
router.post('/reset-password', [
  body('token')
    .notEmpty()
    .withMessage('Token requerido'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('La contraseña debe tener al menos 8 caracteres')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('La contraseña debe contener al menos una mayúscula, una minúscula y un número')

], asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: 'Datos inválidos',
      details: errors.array()
    });
  }

  const { token, password } = req.body;

  // Hash del token para comparar
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Buscar usuario con token válido y no expirado
  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw createError('Token inválido o expirado', 400);
  }

  // Actualizar contraseña
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  user.loginAttempts = 0;
  user.lockUntil = undefined;

  await user.save();

  res.json({
    success: true,
    message: 'Contraseña restablecida exitosamente'
  });
}));

// Función auxiliar para simular validación de ClaveÚnica
async function simulateClaveUnicaValidation(authorizationCode) {
  // En una implementación real, aquí se haría la llamada a la API de ClaveÚnica
  // Simulamos un usuario de ejemplo
  return {
    id: 'clave-unica-' + authorizationCode,
    firstName: 'Juan',
    lastName: 'Pérez',
    email: 'juan.perez@email.com',
    rut: '12345678-9',
    phone: '+56912345678',
    address: {
      street: 'Av. Libertador 123',
      city: 'Santiago',
      region: 'Metropolitana'
    }
  };
}

module.exports = router;