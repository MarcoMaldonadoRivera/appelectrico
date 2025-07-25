const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware de autenticación principal
const authMiddleware = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        error: 'Token de acceso requerido',
        code: 'NO_TOKEN'
      });
    }

    // Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos
    const user = await User.findById(decoded.userId).select('+password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Usuario no encontrado',
        code: 'USER_NOT_FOUND'
      });
    }

    // Verificar si la cuenta está activa
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Cuenta desactivada',
        code: 'ACCOUNT_DISABLED'
      });
    }

    // Verificar si la cuenta está bloqueada
    if (user.isLocked) {
      return res.status(423).json({
        error: 'Cuenta temporalmente bloqueada por múltiples intentos fallidos',
        code: 'ACCOUNT_LOCKED',
        unlockTime: user.lockUntil
      });
    }

    // Verificar si es técnico y tiene certificación válida
    if (user.userType === 'tecnico') {
      const certValidation = await validateTechnicianCertification(user);
      if (!certValidation.valid) {
        return res.status(403).json({
          error: 'Certificación SEC inválida o expirada',
          code: 'INVALID_CERTIFICATION',
          details: certValidation.reason
        });
      }
    }

    // Actualizar último acceso
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    // Adjuntar usuario a la request
    req.user = user;
    req.userId = user._id;
    req.userType = user.userType;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'TOKEN_EXPIRED'
      });
    }
    
    console.error('Error en middleware de autenticación:', error);
    return res.status(500).json({
      error: 'Error interno del servidor',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar tipos de usuario específicos
const requireUserType = (...allowedTypes) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Autenticación requerida',
        code: 'AUTH_REQUIRED'
      });
    }

    if (!allowedTypes.includes(req.user.userType)) {
      return res.status(403).json({
        error: 'Permisos insuficientes',
        code: 'INSUFFICIENT_PERMISSIONS',
        required: allowedTypes,
        current: req.user.userType
      });
    }

    next();
  };
};

// Middleware para verificar certificación SEC válida (solo técnicos)
const requireValidSecCertification = async (req, res, next) => {
  try {
    if (req.user.userType !== 'tecnico') {
      return res.status(403).json({
        error: 'Solo técnicos certificados pueden realizar esta acción',
        code: 'TECHNICIAN_REQUIRED'
      });
    }

    const certValidation = await validateTechnicianCertification(req.user);
    
    if (!certValidation.valid) {
      return res.status(403).json({
        error: 'Certificación SEC requerida',
        code: 'CERTIFICATION_REQUIRED',
        details: certValidation.reason
      });
    }

    next();
  } catch (error) {
    console.error('Error verificando certificación SEC:', error);
    return res.status(500).json({
      error: 'Error verificando certificación',
      code: 'CERTIFICATION_ERROR'
    });
  }
};

// Middleware para verificar que el usuario puede acceder a recursos específicos
const requireOwnership = (resourceField = 'client') => {
  return async (req, res, next) => {
    try {
      // Los administradores pueden acceder a todo
      if (req.user.userType === 'admin') {
        return next();
      }

      const resourceId = req.params.id;
      
      // Determinar el modelo basado en la ruta
      let Model;
      const path = req.route.path;
      
      if (path.includes('quotation')) {
        Model = require('../models/Quotation');
      } else if (path.includes('report')) {
        Model = require('../models/Report');
      } else {
        return res.status(400).json({
          error: 'Tipo de recurso no soportado',
          code: 'UNSUPPORTED_RESOURCE'
        });
      }

      const resource = await Model.findById(resourceId);
      
      if (!resource) {
        return res.status(404).json({
          error: 'Recurso no encontrado',
          code: 'RESOURCE_NOT_FOUND'
        });
      }

      // Verificar propiedad del recurso
      const ownerId = resource[resourceField]?.toString();
      const userId = req.user._id.toString();
      
      // Los técnicos pueden acceder a recursos asignados
      if (req.user.userType === 'tecnico') {
        const assignedTechnicianId = resource.assignedTechnician?.toString() || 
                                    resource.technician?.toString();
        
        if (assignedTechnicianId === userId) {
          return next();
        }
      }
      
      // Los clientes solo pueden acceder a sus propios recursos
      if (req.user.userType === 'cliente' && ownerId !== userId) {
        return res.status(403).json({
          error: 'No tienes permisos para acceder a este recurso',
          code: 'ACCESS_DENIED'
        });
      }

      next();
    } catch (error) {
      console.error('Error verificando propiedad del recurso:', error);
      return res.status(500).json({
        error: 'Error verificando permisos',
        code: 'PERMISSION_ERROR'
      });
    }
  };
};

// Middleware opcional de autenticación (para endpoints públicos con funcionalidad extra para usuarios autenticados)
const optionalAuth = async (req, res, next) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive && !user.isLocked) {
        req.user = user;
        req.userId = user._id;
        req.userType = user.userType;
      }
    }
    
    next();
  } catch (error) {
    // En caso de error, simplemente continuar sin usuario autenticado
    next();
  }
};

// Funciones auxiliares
function extractToken(req) {
  // Buscar token en header Authorization
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    return req.headers.authorization.substring(7);
  }
  
  // Buscar token en cookies (para aplicaciones web)
  if (req.cookies && req.cookies.token) {
    return req.cookies.token;
  }
  
  // Buscar token en query string (menos seguro, solo para casos específicos)
  if (req.query.token) {
    return req.query.token;
  }
  
  return null;
}

async function validateTechnicianCertification(user) {
  if (user.userType !== 'tecnico') {
    return { valid: false, reason: 'No es técnico' };
  }

  if (!user.secCertification) {
    return { valid: false, reason: 'Sin información de certificación' };
  }

  if (!user.secCertification.verified) {
    return { valid: false, reason: 'Certificación no verificada' };
  }

  if (!user.secCertification.expirationDate) {
    return { valid: false, reason: 'Sin fecha de expiración' };
  }

  if (user.secCertification.expirationDate < new Date()) {
    return { valid: false, reason: 'Certificación expirada' };
  }

  return { valid: true };
}

// Generar token JWT
function generateToken(userId) {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { 
      expiresIn: process.env.JWT_EXPIRE || '30d',
      issuer: 'servicios-electricos-chile',
      audience: 'app-users'
    }
  );
}

// Verificar token sin middleware (para uso directo)
async function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive || user.isLocked) {
      return null;
    }
    
    return user;
  } catch (error) {
    return null;
  }
}

module.exports = {
  authMiddleware,
  requireUserType,
  requireValidSecCertification,
  requireOwnership,
  optionalAuth,
  generateToken,
  verifyToken,
  validateTechnicianCertification
};