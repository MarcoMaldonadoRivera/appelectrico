const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  // Datos personales básicos
  firstName: {
    type: String,
    required: [true, 'El nombre es requerido'],
    trim: true,
    maxlength: [50, 'El nombre no puede exceder 50 caracteres']
  },
  lastName: {
    type: String,
    required: [true, 'El apellido es requerido'],
    trim: true,
    maxlength: [50, 'El apellido no puede exceder 50 caracteres']
  },
  email: {
    type: String,
    required: [true, 'El email es requerido'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Email inválido']
  },
  password: {
    type: String,
    required: function() {
      return !this.claveUnicaId; // Requerido solo si no usa ClaveÚnica
    },
    minlength: [8, 'La contraseña debe tener al menos 8 caracteres'],
    select: false
  },
  
  // RUT chileno (requerido por normativas SEC)
  rut: {
    type: String,
    required: [true, 'El RUT es requerido'],
    unique: true,
    validate: {
      validator: function(rut) {
        // Validación básica de formato RUT chileno
        const rutRegex = /^[0-9]+[-|‐]{1}[0-9kK]{1}$/;
        return rutRegex.test(rut);
      },
      message: 'Formato de RUT inválido (ej: 12345678-9)'
    }
  },
  
  // Datos de contacto
  phone: {
    type: String,
    required: [true, 'El teléfono es requerido'],
    match: [/^\+?56?[0-9]{8,9}$/, 'Formato de teléfono chileno inválido']
  },
  
  // Dirección completa
  address: {
    street: {
      type: String,
      required: [true, 'La dirección es requerida'],
      maxlength: [200, 'La dirección no puede exceder 200 caracteres']
    },
    city: {
      type: String,
      required: [true, 'La ciudad es requerida'],
      maxlength: [100, 'La ciudad no puede exceder 100 caracteres']
    },
    region: {
      type: String,
      required: [true, 'La región es requerida'],
      enum: [
        'Arica y Parinacota',
        'Tarapacá',
        'Antofagasta',
        'Atacama',
        'Coquimbo',
        'Valparaíso',
        'Metropolitana',
        'O\'Higgins',
        'Maule',
        'Ñuble',
        'Biobío',
        'La Araucanía',
        'Los Ríos',
        'Los Lagos',
        'Aysén',
        'Magallanes'
      ]
    },
    postalCode: {
      type: String,
      maxlength: [10, 'El código postal no puede exceder 10 caracteres']
    },
    coordinates: {
      lat: Number,
      lng: Number
    }
  },
  
  // Tipo de usuario
  userType: {
    type: String,
    required: [true, 'El tipo de usuario es requerido'],
    enum: ['cliente', 'tecnico', 'admin'],
    default: 'cliente'
  },
  
  // Datos específicos para técnicos SEC
  secCertification: {
    licenseNumber: {
      type: String,
      required: function() {
        return this.userType === 'tecnico';
      },
      validate: {
        validator: function(license) {
          if (this.userType !== 'tecnico') return true;
          // Validación de formato de licencia SEC
          return /^SEC-[A-Z0-9]{6,12}$/.test(license);
        },
        message: 'Formato de licencia SEC inválido'
      }
    },
    certificationLevel: {
      type: String,
      enum: ['Instalador Básico', 'Instalador Especialista', 'Instalador Experto'],
      required: function() {
        return this.userType === 'tecnico';
      }
    },
    categories: [{
      type: String,
      enum: [
        'Instalaciones domiciliarias',
        'Instalaciones industriales',
        'Líneas de transmisión',
        'Subestaciones',
        'Energías renovables',
        'Sistemas de emergencia'
      ]
    }],
    expirationDate: {
      type: Date,
      required: function() {
        return this.userType === 'tecnico';
      }
    },
    verified: {
      type: Boolean,
      default: false
    },
    verificationDate: Date,
    ricCertifications: [{
      ricNumber: {
        type: String,
        enum: ['RIC-1', 'RIC-2', 'RIC-3', 'RIC-4', 'RIC-5', 'RIC-6', 'RIC-7', 'RIC-8', 'RIC-9', 'RIC-10', 'RIC-11', 'RIC-12', 'RIC-13', 'RIC-14', 'RIC-15', 'RIC-16', 'RIC-17', 'RIC-18', 'RIC-19']
      },
      certified: Boolean,
      certificationDate: Date
    }]
  },
  
  // Autenticación con ClaveÚnica
  claveUnicaId: {
    type: String,
    sparse: true,
    unique: true
  },
  
  // Estado de la cuenta
  isActive: {
    type: Boolean,
    default: true
  },
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: String,
  passwordResetToken: String,
  passwordResetExpires: Date,
  
  // Configuraciones de perfil
  profileImage: {
    type: String,
    default: null
  },
  preferences: {
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true }
    },
    language: {
      type: String,
      enum: ['es', 'en'],
      default: 'es'
    }
  },
  
  // Datos de auditoría
  lastLogin: Date,
  loginAttempts: {
    type: Number,
    default: 0
  },
  lockUntil: Date,
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
userSchema.index({ email: 1 });
userSchema.index({ rut: 1 });
userSchema.index({ userType: 1 });
userSchema.index({ 'secCertification.licenseNumber': 1 });
userSchema.index({ 'address.region': 1 });

// Virtual para nombre completo
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual para verificar si la cuenta está bloqueada
userSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Virtual para verificar si la certificación SEC está vigente
userSchema.virtual('secCertification.isValid').get(function() {
  if (this.userType !== 'tecnico') return null;
  return this.secCertification.verified && 
         this.secCertification.expirationDate > new Date();
});

// Middleware pre-save para hash de contraseña
userSchema.pre('save', async function(next) {
  // Solo hash si la contraseña ha sido modificada
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Método para incrementar intentos de login
userSchema.methods.incLoginAttempts = function() {
  // Si ya estamos bloqueados y el bloqueo expiró
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // Bloquear después de 5 intentos fallidos por 2 horas
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = {
      lockUntil: Date.now() + 2 * 60 * 60 * 1000 // 2 horas
    };
  }
  
  return this.updateOne(updates);
};

// Método para validar certificación SEC
userSchema.methods.validateSecCertification = async function() {
  if (this.userType !== 'tecnico') {
    throw new Error('Solo los técnicos requieren certificación SEC');
  }
  
  // Aquí se implementaría la integración con la API de SEC (e-RNII)
  // Por ahora simulamos la validación
  const isValid = this.secCertification.licenseNumber && 
                  this.secCertification.expirationDate > new Date();
  
  if (isValid) {
    this.secCertification.verified = true;
    this.secCertification.verificationDate = new Date();
    await this.save();
  }
  
  return isValid;
};

// Método para obtener certificaciones RIC activas
userSchema.methods.getActiveRicCertifications = function() {
  if (this.userType !== 'tecnico') return [];
  
  return this.secCertification.ricCertifications.filter(cert => cert.certified);
};

module.exports = mongoose.model('User', userSchema);