const mongoose = require('mongoose');

const quotationSchema = new mongoose.Schema({
  // Información del cliente
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El cliente es requerido']
  },
  
  // Número de cotización único
  quotationNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Técnico asignado
  assignedTechnician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // Tipo de servicio requerido
  serviceType: {
    type: String,
    required: [true, 'El tipo de servicio es requerido'],
    enum: [
      'Instalación Nueva',
      'Mantenimiento',
      'Reparación',
      'Inspección',
      'Certificación',
      'Ampliación',
      'Modernización'
    ]
  },
  
  // Categoría de instalación según SEC
  installationCategory: {
    type: String,
    required: true,
    enum: [
      'Domiciliaria Simple',
      'Domiciliaria Compleja',
      'Comercial Menor',
      'Comercial Mayor',
      'Industrial Menor',
      'Industrial Mayor'
    ]
  },
  
  // Tipo de conexión eléctrica
  connectionType: {
    type: String,
    required: true,
    enum: ['Monofásico', 'Bifásico', 'Trifásico']
  },
  
  // Voltaje de la instalación
  voltage: {
    type: Number,
    required: true,
    enum: [220, 380, 13200, 23000] // Voltajes estándar en Chile
  },
  
  // Detalles de la instalación
  installationDetails: {
    // Ubicación del proyecto
    location: {
      address: {
        type: String,
        required: true
      },
      city: String,
      region: String,
      coordinates: {
        lat: Number,
        lng: Number
      }
    },
    
    // Características de la instalación
    characteristics: {
      buildingType: {
        type: String,
        enum: ['Casa', 'Departamento', 'Local Comercial', 'Oficina', 'Industria', 'Otro']
      },
      area: Number, // metros cuadrados
      floors: Number,
      rooms: Number,
      existingInstallation: Boolean,
      installationAge: Number // años
    },
    
    // Componentes requeridos
    components: [{
      type: {
        type: String,
        required: true,
        enum: [
          'Tablero Eléctrico',
          'Medidor',
          'Interruptor Automático',
          'Interruptor Diferencial',
          'Empalme',
          'Cableado',
          'Enchufes',
          'Interruptores',
          'Luminarias',
          'Protector de Sobretensión',
          'Sistema de Puesta a Tierra',
          'Otro'
        ]
      },
      description: String,
      quantity: {
        type: Number,
        required: true,
        min: 1
      },
      specifications: String,
      unitPrice: Number,
      totalPrice: Number,
      ricCompliance: String // RIC específico que cumple
    }],
    
    // Normativas SEC aplicables
    applicableNorms: [{
      norm: {
        type: String,
        enum: [
          'DS 8 - Reglamento de Instalaciones de Consumo',
          'RIC 1 - Medidores',
          'RIC 2 - Empalmes',
          'RIC 3 - Alimentadores',
          'RIC 4 - Conductores',
          'RIC 5 - Protección contra Tensiones Peligrosas',
          'RIC 6 - Instalaciones de Puesta a Tierra',
          'RIC 7 - Alumbrado Público',
          'RIC 8 - Subestaciones',
          'RIC 9 - Líneas Aéreas',
          'RIC 10 - Líneas Subterráneas',
          'RIC 11 - Protecciones del Sistema',
          'RIC 12 - Centrales Eléctricas',
          'RIC 13 - Torres de Alta Tensión',
          'RIC 14 - Instalaciones de Clientes',
          'RIC 15 - Conexiones',
          'RIC 16 - Sistemas de Emergencia',
          'RIC 17 - Eficiencia Energética',
          'RIC 18 - Energías Renovables',
          'RIC 19 - Certificación'
        ]
      },
      applicable: Boolean,
      requirements: String
    }]
  },
  
  // Costos calculados
  costs: {
    // Costos de materiales
    materials: {
      type: Number,
      default: 0
    },
    
    // Costos de mano de obra
    labor: {
      type: Number,
      default: 0
    },
    
    // Costos de certificaciones SEC
    certifications: {
      te1: { type: Number, default: 0 }, // Certificado TE1
      tc6: { type: Number, default: 0 }, // Certificado TC6
      other: { type: Number, default: 0 }
    },
    
    // Costos adicionales
    additional: {
      transport: { type: Number, default: 0 },
      permits: { type: Number, default: 0 },
      inspection: { type: Number, default: 0 },
      emergency: { type: Number, default: 0 }
    },
    
    // Subtotal sin IVA
    subtotal: {
      type: Number,
      default: 0
    },
    
    // IVA (19% en Chile)
    tax: {
      type: Number,
      default: 0
    },
    
    // Total con IVA
    total: {
      type: Number,
      default: 0
    }
  },
  
  // Tiempo estimado
  estimatedTime: {
    preparation: Number, // horas
    execution: Number,   // horas
    certification: Number, // horas
    total: Number        // horas totales
  },
  
  // Estado de la cotización
  status: {
    type: String,
    enum: ['Borrador', 'Enviada', 'Aprobada', 'Rechazada', 'Expirada', 'En Ejecución', 'Completada'],
    default: 'Borrador'
  },
  
  // Validez de la cotización
  validUntil: {
    type: Date,
    required: true,
    default: function() {
      return new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 días
    }
  },
  
  // Documentos generados
  documents: {
    quotationPdf: String, // URL del PDF
    technicalSpecsPdf: String,
    complianceCertificate: String
  },
  
  // Observaciones y notas
  notes: {
    technical: String,
    commercial: String,
    client: String
  },
  
  // Historial de cambios
  revisions: [{
    version: Number,
    changes: String,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    modifiedAt: {
      type: Date,
      default: Date.now
    }
  }],
  
  // Datos de auditoría
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Integración con sistemas externos
  externalReferences: {
    secFileNumber: String, // Número de expediente SEC
    municipalPermit: String,
    utilityCompanyRef: String
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
quotationSchema.index({ quotationNumber: 1 });
quotationSchema.index({ client: 1 });
quotationSchema.index({ assignedTechnician: 1 });
quotationSchema.index({ status: 1 });
quotationSchema.index({ createdAt: -1 });
quotationSchema.index({ validUntil: 1 });

// Virtual para verificar si está expirada
quotationSchema.virtual('isExpired').get(function() {
  return this.validUntil < new Date();
});

// Virtual para calcular días restantes de validez
quotationSchema.virtual('daysRemaining').get(function() {
  const diff = this.validUntil - new Date();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
});

// Middleware pre-save para calcular costos
quotationSchema.pre('save', function(next) {
  // Calcular costos totales
  this.costs.subtotal = this.costs.materials + 
                       this.costs.labor + 
                       this.costs.certifications.te1 + 
                       this.costs.certifications.tc6 + 
                       this.costs.certifications.other +
                       this.costs.additional.transport +
                       this.costs.additional.permits +
                       this.costs.additional.inspection +
                       this.costs.additional.emergency;
  
  // Calcular IVA (19% en Chile)
  this.costs.tax = this.costs.subtotal * 0.19;
  
  // Calcular total
  this.costs.total = this.costs.subtotal + this.costs.tax;
  
  // Calcular tiempo total estimado
  this.estimatedTime.total = (this.estimatedTime.preparation || 0) +
                            (this.estimatedTime.execution || 0) +
                            (this.estimatedTime.certification || 0);
  
  next();
});

// Método para generar número de cotización
quotationSchema.statics.generateQuotationNumber = async function() {
  const count = await this.countDocuments();
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const sequential = String(count + 1).padStart(4, '0');
  
  return `COT-${year}${month}-${sequential}`;
};

// Método para calcular costos automáticamente basado en componentes
quotationSchema.methods.calculateCosts = function() {
  let materialsCost = 0;
  let laborCost = 0;
  
  // Calcular costos de componentes
  this.installationDetails.components.forEach(component => {
    materialsCost += component.totalPrice || 0;
  });
  
  // Calcular mano de obra (estimación basada en tipo de instalación)
  const laborRates = {
    'Domiciliaria Simple': 25000,     // CLP por hora
    'Domiciliaria Compleja': 35000,
    'Comercial Menor': 45000,
    'Comercial Mayor': 55000,
    'Industrial Menor': 65000,
    'Industrial Mayor': 85000
  };
  
  const hourlyRate = laborRates[this.installationCategory] || 35000;
  laborCost = (this.estimatedTime.total || 8) * hourlyRate;
  
  // Calcular costos de certificación según tipo de servicio
  let certificationCosts = { te1: 0, tc6: 0, other: 0 };
  
  if (this.serviceType === 'Instalación Nueva' || this.serviceType === 'Ampliación') {
    certificationCosts.te1 = 45000; // Costo típico TE1
  }
  
  if (this.installationCategory.includes('Comercial') || this.installationCategory.includes('Industrial')) {
    certificationCosts.tc6 = 85000; // Costo típico TC6
  }
  
  // Actualizar costos
  this.costs.materials = materialsCost;
  this.costs.labor = laborCost;
  this.costs.certifications = certificationCosts;
  
  return this.costs;
};

// Método para validar cumplimiento de normativas SEC
quotationSchema.methods.validateSecCompliance = function() {
  const errors = [];
  
  // Validar que hay un técnico certificado asignado
  if (!this.assignedTechnician) {
    errors.push('Se requiere un técnico certificado SEC asignado');
  }
  
  // Validar componentes obligatorios según normativas
  const requiredComponents = this.getRequiredComponents();
  const componentTypes = this.installationDetails.components.map(c => c.type);
  
  requiredComponents.forEach(required => {
    if (!componentTypes.includes(required)) {
      errors.push(`Componente requerido faltante: ${required}`);
    }
  });
  
  return {
    isCompliant: errors.length === 0,
    errors: errors
  };
};

// Método para obtener componentes requeridos según tipo de instalación
quotationSchema.methods.getRequiredComponents = function() {
  const baseComponents = ['Tablero Eléctrico', 'Sistema de Puesta a Tierra'];
  
  if (this.serviceType === 'Instalación Nueva') {
    baseComponents.push('Medidor', 'Interruptor Automático', 'Interruptor Diferencial');
  }
  
  if (this.voltage > 220) {
    baseComponents.push('Protector de Sobretensión');
  }
  
  return baseComponents;
};

module.exports = mongoose.model('Quotation', quotationSchema);