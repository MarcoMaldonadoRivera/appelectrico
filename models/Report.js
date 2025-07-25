const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  // Tipo de reporte
  reportType: {
    type: String,
    required: [true, 'El tipo de reporte es requerido'],
    enum: ['Diagnóstico', 'Trabajo Realizado', 'Inspección', 'Mantenimiento', 'Certificación']
  },
  
  // Número de reporte único
  reportNumber: {
    type: String,
    unique: true,
    required: true
  },
  
  // Información del cliente
  client: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El cliente es requerido']
  },
  
  // Técnico responsable
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'El técnico es requerido']
  },
  
  // Cotización relacionada (opcional)
  relatedQuotation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Quotation'
  },
  
  // Ubicación del trabajo
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
  
  // Fecha y hora del trabajo
  workDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  
  duration: {
    start: Date,
    end: Date,
    totalHours: Number
  },
  
  // Datos específicos del diagnóstico (si es tipo Diagnóstico)
  diagnosis: {
    // Estado general de la instalación
    generalCondition: {
      type: String,
      enum: ['Excelente', 'Bueno', 'Regular', 'Malo', 'Crítico']
    },
    
    // Evaluación por componentes
    componentEvaluation: [{
      component: {
        type: String,
        enum: [
          'Tablero Eléctrico',
          'Medidor',
          'Interruptores Automáticos',
          'Interruptores Diferenciales',
          'Sistema de Puesta a Tierra',
          'Cableado',
          'Enchufes y Tomacorrientes',
          'Interruptores de Luz',
          'Luminarias',
          'Protecciones',
          'Empalmes'
        ]
      },
      condition: {
        type: String,
        enum: ['Excelente', 'Bueno', 'Regular', 'Malo', 'Crítico', 'No Aplica']
      },
      observations: String,
      ricCompliance: {
        compliant: Boolean,
        applicableRic: String,
        deviations: String
      },
      recommendations: String,
      urgency: {
        type: String,
        enum: ['Inmediata', 'Corto Plazo', 'Mediano Plazo', 'Largo Plazo', 'No Urgente']
      }
    }],
    
    // Hallazgos de seguridad
    safetyFindings: [{
      finding: String,
      riskLevel: {
        type: String,
        enum: ['Crítico', 'Alto', 'Medio', 'Bajo']
      },
      ricViolation: String,
      immediateAction: String,
      longTermSolution: String
    }],
    
    // Cumplimiento normativo general
    complianceStatus: {
      ds8Compliant: Boolean,
      ricCompliant: Boolean,
      nonCompliantItems: [String],
      overallScore: {
        type: Number,
        min: 0,
        max: 100
      }
    }
  },
  
  // Datos del trabajo realizado (si es tipo Trabajo Realizado)
  workPerformed: {
    // Tipo de trabajo
    workType: {
      type: String,
      enum: [
        'Instalación Nueva',
        'Reparación',
        'Mantenimiento',
        'Modernización',
        'Ampliación',
        'Certificación',
        'Inspección Correctiva'
      ]
    },
    
    // Actividades realizadas
    activities: [{
      activity: {
        type: String,
        required: true
      },
      description: String,
      materialUsed: [{
        item: String,
        quantity: Number,
        unit: String,
        brand: String,
        model: String,
        ricCertified: Boolean
      }],
      timeSpent: Number, // horas
      photos: [String], // URLs de fotos
      beforePhoto: String,
      afterPhoto: String
    }],
    
    // Pruebas realizadas
    testsPerformed: [{
      testType: {
        type: String,
        enum: [
          'Medición de Resistencia de Puesta a Tierra',
          'Medición de Aislación',
          'Prueba de Continuidad',
          'Medición de Corriente de Fuga',
          'Prueba de Funcionamiento de Protecciones',
          'Medición de Tensión',
          'Prueba de Resistencia de Conductores'
        ]
      },
      result: String,
      measurements: [{
        parameter: String,
        value: Number,
        unit: String,
        acceptableRange: String,
        passed: Boolean
      }],
      ricStandard: String,
      observations: String
    }],
    
    // Componentes instalados/reemplazados
    componentsChanged: [{
      component: String,
      action: {
        type: String,
        enum: ['Instalado', 'Reemplazado', 'Reparado', 'Removido']
      },
      oldComponent: String,
      newComponent: String,
      specifications: String,
      warranty: {
        period: Number, // meses
        conditions: String
      }
    }]
  },
  
  // Certificaciones SEC generadas
  certifications: {
    te1: {
      generated: Boolean,
      certificateNumber: String,
      issueDate: Date,
      expirationDate: Date,
      fileUrl: String
    },
    tc6: {
      generated: Boolean,
      certificateNumber: String,
      issueDate: Date,
      expirationDate: Date,
      fileUrl: String
    },
    other: [{
      type: String,
      certificateNumber: String,
      issueDate: Date,
      expirationDate: Date,
      fileUrl: String
    }]
  },
  
  // Documentación generada
  documentation: {
    reportPdf: String, // URL del reporte principal
    photosZip: String, // URL del archivo con fotos
    measurementsSheet: String,
    certificationDocuments: [String],
    technicalDrawings: [String]
  },
  
  // Observaciones y recomendaciones
  observations: {
    technical: String,
    safety: String,
    maintenance: String,
    client: String
  },
  
  recommendations: [{
    category: {
      type: String,
      enum: ['Seguridad', 'Mantenimiento', 'Eficiencia', 'Cumplimiento Normativo', 'Mejoras']
    },
    description: String,
    priority: {
      type: String,
      enum: ['Alta', 'Media', 'Baja']
    },
    estimatedCost: Number,
    timeframe: String
  }],
  
  // Firmas digitales
  signatures: {
    technician: {
      signed: Boolean,
      signedAt: Date,
      signatureImage: String,
      digitalSignature: String
    },
    client: {
      signed: Boolean,
      signedAt: Date,
      signatureImage: String,
      satisfied: Boolean,
      comments: String
    }
  },
  
  // Estado del reporte
  status: {
    type: String,
    enum: ['Borrador', 'En Revisión', 'Completado', 'Enviado', 'Aprobado por Cliente'],
    default: 'Borrador'
  },
  
  // Calificación del servicio
  serviceRating: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    feedback: String,
    wouldRecommend: Boolean,
    ratedAt: Date
  },
  
  // Seguimiento post-trabajo
  followUp: {
    required: Boolean,
    scheduledDate: Date,
    reason: String,
    completed: Boolean,
    completedDate: Date,
    notes: String
  },
  
  // Facturación relacionada
  billing: {
    invoiceNumber: String,
    amount: Number,
    status: {
      type: String,
      enum: ['Pendiente', 'Enviada', 'Pagada', 'Vencida']
    },
    dueDate: Date,
    paidDate: Date
  },
  
  // Datos de auditoría
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  
  // Información meteorológica del día del trabajo
  weatherConditions: {
    temperature: Number,
    humidity: Number,
    conditions: String,
    affectedWork: Boolean
  }
  
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Índices para optimización
reportSchema.index({ reportNumber: 1 });
reportSchema.index({ client: 1 });
reportSchema.index({ technician: 1 });
reportSchema.index({ reportType: 1 });
reportSchema.index({ workDate: -1 });
reportSchema.index({ status: 1 });
reportSchema.index({ 'certifications.te1.certificateNumber': 1 });
reportSchema.index({ 'certifications.tc6.certificateNumber': 1 });

// Virtual para obtener la duración total en horas
reportSchema.virtual('totalHours').get(function() {
  if (this.duration.start && this.duration.end) {
    const diff = this.duration.end - this.duration.start;
    return Math.round((diff / (1000 * 60 * 60)) * 100) / 100; // Redondear a 2 decimales
  }
  return this.duration.totalHours || 0;
});

// Virtual para verificar si requiere certificación SEC
reportSchema.virtual('requiresSecCertification').get(function() {
  const certificationTypes = ['Trabajo Realizado', 'Instalación Nueva', 'Certificación'];
  return certificationTypes.includes(this.reportType);
});

// Método para generar número de reporte
reportSchema.statics.generateReportNumber = async function(reportType) {
  const count = await this.countDocuments({ reportType });
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const sequential = String(count + 1).padStart(4, '0');
  
  const prefix = {
    'Diagnóstico': 'DIAG',
    'Trabajo Realizado': 'TRAB',
    'Inspección': 'INSP',
    'Mantenimiento': 'MANT',
    'Certificación': 'CERT'
  }[reportType] || 'REP';
  
  return `${prefix}-${year}${month}-${sequential}`;
};

// Método para calcular puntaje de cumplimiento normativo
reportSchema.methods.calculateComplianceScore = function() {
  if (this.reportType !== 'Diagnóstico') return null;
  
  const components = this.diagnosis.componentEvaluation;
  if (!components || components.length === 0) return 0;
  
  let totalScore = 0;
  let evaluatedComponents = 0;
  
  components.forEach(comp => {
    if (comp.condition !== 'No Aplica') {
      const scores = {
        'Excelente': 100,
        'Bueno': 80,
        'Regular': 60,
        'Malo': 40,
        'Crítico': 20
      };
      
      totalScore += scores[comp.condition] || 0;
      evaluatedComponents++;
    }
  });
  
  const averageScore = evaluatedComponents > 0 ? totalScore / evaluatedComponents : 0;
  
  // Actualizar el puntaje en el documento
  if (this.diagnosis.complianceStatus) {
    this.diagnosis.complianceStatus.overallScore = Math.round(averageScore);
  }
  
  return Math.round(averageScore);
};

// Método para generar recomendaciones automáticas basadas en diagnóstico
reportSchema.methods.generateAutoRecommendations = function() {
  if (this.reportType !== 'Diagnóstico') return [];
  
  const autoRecommendations = [];
  
  this.diagnosis.componentEvaluation.forEach(comp => {
    if (comp.condition === 'Crítico' || comp.condition === 'Malo') {
      autoRecommendations.push({
        category: 'Seguridad',
        description: `Reparar o reemplazar ${comp.component} inmediatamente`,
        priority: comp.condition === 'Crítico' ? 'Alta' : 'Media',
        timeframe: comp.condition === 'Crítico' ? '24 horas' : '1 semana'
      });
    }
    
    if (!comp.ricCompliance.compliant) {
      autoRecommendations.push({
        category: 'Cumplimiento Normativo',
        description: `Actualizar ${comp.component} para cumplir con ${comp.ricCompliance.applicableRic}`,
        priority: 'Alta',
        timeframe: '30 días'
      });
    }
  });
  
  // Agregar recomendaciones de mantenimiento preventivo
  autoRecommendations.push({
    category: 'Mantenimiento',
    description: 'Programar inspección anual según DS 8',
    priority: 'Media',
    timeframe: '12 meses'
  });
  
  return autoRecommendations;
};

// Método para validar que se realizaron todas las pruebas requeridas
reportSchema.methods.validateRequiredTests = function() {
  if (this.reportType !== 'Trabajo Realizado') return { valid: true, missing: [] };
  
  const requiredTests = [
    'Medición de Resistencia de Puesta a Tierra',
    'Prueba de Funcionamiento de Protecciones'
  ];
  
  const performedTests = this.workPerformed.testsPerformed.map(test => test.testType);
  const missingTests = requiredTests.filter(test => !performedTests.includes(test));
  
  return {
    valid: missingTests.length === 0,
    missing: missingTests
  };
};

// Método para generar certificados SEC automáticamente
reportSchema.methods.generateSecCertificates = async function() {
  if (!this.requiresSecCertification) return false;
  
  // Generar TE1 para instalaciones domiciliarias
  if (this.workPerformed.workType === 'Instalación Nueva') {
    this.certifications.te1 = {
      generated: true,
      certificateNumber: `TE1-${Date.now()}`,
      issueDate: new Date(),
      expirationDate: new Date(Date.now() + 5 * 365 * 24 * 60 * 60 * 1000) // 5 años
    };
  }
  
  // Generar TC6 para instalaciones comerciales/industriales
  if (['Comercial', 'Industrial'].some(type => 
    this.relatedQuotation && this.relatedQuotation.installationCategory.includes(type))) {
    this.certifications.tc6 = {
      generated: true,
      certificateNumber: `TC6-${Date.now()}`,
      issueDate: new Date(),
      expirationDate: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000) // 3 años
    };
  }
  
  await this.save();
  return true;
};

module.exports = mongoose.model('Report', reportSchema);