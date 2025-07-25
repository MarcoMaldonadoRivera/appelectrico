const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log del error para debugging
  console.error('Error:', err);

  // Error de validación de Mongoose
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = {
      statusCode: 400,
      message: 'Datos de entrada inválidos',
      errors: message
    };
  }

  // Error de recurso no encontrado de Mongoose
  if (err.name === 'CastError') {
    const message = 'Recurso no encontrado';
    error = {
      statusCode: 404,
      message
    };
  }

  // Error de clave duplicada de Mongoose
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    let message = `${field} ya existe`;
    
    // Mensajes específicos para campos conocidos
    if (field === 'email') {
      message = 'Ya existe una cuenta con este email';
    } else if (field === 'rut') {
      message = 'Ya existe una cuenta con este RUT';
    } else if (field === 'quotationNumber') {
      message = 'Número de cotización duplicado';
    } else if (field === 'reportNumber') {
      message = 'Número de reporte duplicado';
    }
    
    error = {
      statusCode: 400,
      message
    };
  }

  // Error de JWT
  if (err.name === 'JsonWebTokenError') {
    const message = 'Token de acceso inválido';
    error = {
      statusCode: 401,
      message
    };
  }

  // Error de token expirado
  if (err.name === 'TokenExpiredError') {
    const message = 'Token de acceso expirado';
    error = {
      statusCode: 401,
      message
    };
  }

  // Error de límite de tamaño de archivo
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'Archivo demasiado grande';
    error = {
      statusCode: 413,
      message
    };
  }

  // Error de tipo de archivo no soportado
  if (err.code === 'UNSUPPORTED_FILE_TYPE') {
    const message = 'Tipo de archivo no soportado';
    error = {
      statusCode: 415,
      message
    };
  }

  // Error de red/conectividad
  if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
    const message = 'Error de conectividad del servidor';
    error = {
      statusCode: 503,
      message
    };
  }

  // Error de base de datos
  if (err.name === 'MongoError' || err.name === 'MongooseError') {
    const message = 'Error de base de datos';
    error = {
      statusCode: 500,
      message
    };
  }

  // Error de API externa (SEC, Google, OpenAI, etc.)
  if (err.name === 'ExternalAPIError') {
    const message = err.message || 'Error en servicio externo';
    error = {
      statusCode: err.statusCode || 502,
      message,
      service: err.service
    };
  }

  // Error específico de normativas SEC
  if (err.name === 'SecComplianceError') {
    const message = err.message || 'Error de cumplimiento normativo SEC';
    error = {
      statusCode: 422,
      message,
      violations: err.violations || []
    };
  }

  // Error de certificación SEC
  if (err.name === 'CertificationError') {
    const message = err.message || 'Error de certificación SEC';
    error = {
      statusCode: 403,
      message,
      certificationRequired: err.certificationRequired || []
    };
  }

  // Estructura de respuesta de error
  const errorResponse = {
    success: false,
    error: {
      message: error.message || 'Error interno del servidor',
      ...(error.errors && { details: error.errors }),
      ...(error.violations && { violations: error.violations }),
      ...(error.certificationRequired && { certificationRequired: error.certificationRequired }),
      ...(error.service && { service: error.service }),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method
    }
  };

  // En desarrollo, incluir stack trace
  if (process.env.NODE_ENV === 'development') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.raw = err;
  }

  // Log específico para errores críticos
  const statusCode = error.statusCode || 500;
  if (statusCode >= 500) {
    console.error('🚨 Error crítico del servidor:', {
      message: error.message,
      stack: err.stack,
      url: req.originalUrl,
      method: req.method,
      user: req.user ? req.user._id : 'anonymous',
      timestamp: new Date().toISOString()
    });
  }

  res.status(statusCode).json(errorResponse);
};

// Wrapper para funciones async que maneja automáticamente los errores
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Función para crear errores personalizados
const createError = (message, statusCode = 500, type = 'GenericError') => {
  const error = new Error(message);
  error.name = type;
  error.statusCode = statusCode;
  return error;
};

// Función para crear errores de API externa
const createExternalAPIError = (service, message, statusCode = 502) => {
  const error = new Error(message);
  error.name = 'ExternalAPIError';
  error.statusCode = statusCode;
  error.service = service;
  return error;
};

// Función para crear errores de cumplimiento SEC
const createSecComplianceError = (message, violations = []) => {
  const error = new Error(message);
  error.name = 'SecComplianceError';
  error.statusCode = 422;
  error.violations = violations;
  return error;
};

// Función para crear errores de certificación
const createCertificationError = (message, requiredCertifications = []) => {
  const error = new Error(message);
  error.name = 'CertificationError';
  error.statusCode = 403;
  error.certificationRequired = requiredCertifications;
  return error;
};

// Middleware para manejar rutas no encontradas
const notFound = (req, res, next) => {
  const error = createError(
    `Ruta ${req.originalUrl} no encontrada`,
    404,
    'NotFoundError'
  );
  next(error);
};

module.exports = {
  errorHandler,
  asyncHandler,
  createError,
  createExternalAPIError,
  createSecComplianceError,
  createCertificationError,
  notFound
};