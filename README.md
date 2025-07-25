# Plataforma de Servicios Eléctricos Domiciliarios - Chile

## 📋 Descripción General

Plataforma full-stack integral para la gestión de servicios eléctricos domiciliarios en Chile, diseñada para cumplir con las normativas SEC (Superintendencia de Electricidad y Combustibles). La solución combina una aplicación web y móvil que permite la gestión completa de usuarios, generación automatizada de cotizaciones, diagnósticos técnicos, informes certificados, y soporte mediante chat inteligente y reconocimiento de voz.

## 🏗️ Arquitectura Técnica

### Backend
- **Framework**: Node.js con Express.js
- **Base de Datos**: MongoDB con Mongoose ODM
- **Autenticación**: JWT + integración con ClaveÚnica
- **APIs de IA**: 
  - Google Cloud Speech-to-Text (español chileno)
  - Google Dialogflow (chatbot)
  - OpenAI GPT-4o (generación de documentos)
- **Infraestructura**: AWS (EC2, S3, SES)
- **Real-time**: Socket.IO para chat en tiempo real

### Frontend
- **Framework**: React 18 con React Router
- **Estilos**: Tailwind CSS
- **Estado**: React Context + React Query
- **UI/UX**: Headless UI + Heroicons
- **Formularios**: React Hook Form + Yup validation

### Características de IA
- **Procesamiento de Voz**: Conversión de requerimientos de voz a cotizaciones automáticas
- **Chatbot Inteligente**: Respuestas sobre normativas SEC y procedimientos
- **Generación Automática**: Informes técnicos y certificaciones SEC
- **Clasificación Inteligente**: Análisis automático de tipos de requerimiento

## 🔧 Módulos Principales

### 1. Gestión de Usuarios
- Registro diferenciado (clientes vs técnicos SEC)
- Verificación automática de certificaciones SEC via e-RNII
- Autenticación con ClaveÚnica
- Perfiles con validación de RUT chileno

### 2. Reconocimiento de Voz
- Transcripción en español chileno optimizada para términos eléctricos
- Clasificación automática de requerimientos
- Generación de cotizaciones preliminares desde audio
- Soporte para múltiples formatos de audio

### 3. Chatbot Inteligente
- Base de conocimiento sobre normativas SEC (DS 8, RIC 1-19)
- Respuestas automáticas sobre certificaciones TE1/TC6
- Fallback a GPT-4o para consultas complejas
- Sugerencias de acciones contextuales

### 4. Gestión de Cotizaciones
- Cálculo automático basado en normativas SEC
- Validación de cumplimiento normativo
- Generación de PDFs profesionales
- Envío automatizado por email

### 5. Reportes y Diagnósticos
- Plantillas basadas en normativas SEC
- Generación automática de recomendaciones
- Certificados TE1/TC6 digitales
- Firmas digitales y validación

### 6. Sistema de Chat
- Chat en tiempo real técnico-cliente
- Notificaciones push
- Historial de conversaciones
- Escalamiento a soporte humano

## 📊 Cumplimiento Normativo SEC

### Reglamentos Implementados
- **DS 8**: Reglamento de Instalaciones de Consumo
- **RIC 1-19**: Pliegos Técnicos Específicos
- **Certificaciones**: TE1 (domiciliario), TC6 (comercial/industrial)
- **Seguridad**: Medidas contra riesgos eléctricos

### Validaciones Automáticas
- Verificación de instaladores certificados SEC
- Cumplimiento de especificaciones técnicas
- Generación automática de certificados
- Trazabilidad completa de trabajos

## 🚀 Instalación y Configuración

### Prerrequisitos
```bash
Node.js >= 16.0.0
MongoDB >= 4.4
npm o yarn
```

### Configuración del Backend
```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env
# Editar .env con sus credenciales

# Iniciar servidor de desarrollo
npm run dev
```

### Configuración del Frontend
```bash
# Navegar al directorio del cliente
cd client

# Instalar dependencias
npm install

# Iniciar aplicación React
npm start
```

### Variables de Entorno Requeridas

#### Backend (.env)
```env
# Base de datos
MONGODB_URI=mongodb://localhost:27017/servicios_electricos

# JWT
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=30d

# Google Cloud
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_APPLICATION_CREDENTIALS=./config/google-credentials.json

# OpenAI
OPENAI_API_KEY=your_openai_api_key

# AWS
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_S3_BUCKET=servicios-electricos-documents

# ClaveÚnica
CLAVE_UNICA_CLIENT_ID=your_client_id
CLAVE_UNICA_CLIENT_SECRET=your_client_secret
```

## 🛠️ Comandos de Desarrollo

```bash
# Desarrollo completo (backend + frontend)
npm run dev

# Solo backend
npm run server

# Solo frontend
npm run client

# Construcción para producción
npm run build

# Pruebas
npm test

# Linting
npm run lint
```

## 📱 Funcionalidades por Tipo de Usuario

### Clientes
- Registro con verificación de RUT
- Solicitudes por voz de servicios eléctricos
- Recepción de cotizaciones automáticas
- Chat con técnicos certificados
- Acceso a reportes e informes
- Seguimiento de trabajos realizados

### Técnicos SEC
- Registro con verificación de certificación SEC
- Gestión de trabajos asignados
- Generación de reportes técnicos
- Emisión de certificados TE1/TC6
- Chat con clientes
- Dashboard de productividad

### Administradores
- Panel de control completo
- Gestión de usuarios y técnicos
- Analytics y reportes
- Configuración del sistema
- Monitoreo de cumplimiento normativo

## 🔒 Seguridad

### Autenticación
- JWT con expiración configurable
- Integración con ClaveÚnica del Gobierno de Chile
- Bloqueo de cuentas por intentos fallidos
- Verificación de email y teléfono

### Autorización
- Control de acceso basado en roles
- Middleware de verificación de certificaciones SEC
- Validación de propiedad de recursos
- Protección de rutas sensibles

### Datos
- Encriptación AES-256 para datos sensibles
- Cumplimiento con Ley de Protección de Datos Personales
- Backup automático de documentos críticos
- Trazabilidad completa de acciones

## 🤖 Integración de IA

### Speech-to-Text
```javascript
// Ejemplo de uso del reconocimiento de voz
const transcribeAudio = async (audioFile) => {
  const formData = new FormData();
  formData.append('audio', audioFile);
  
  const response = await fetch('/api/speech/transcribe', {
    method: 'POST',
    body: formData,
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```

### Chatbot
```javascript
// Ejemplo de consulta al chatbot
const askChatbot = async (message) => {
  const response = await fetch('/api/chatbot/message', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ message })
  });
  
  return response.json();
};
```

## 📊 Ejemplos de Uso

### Flujo Típico de Cliente

1. **Registro**: Cliente se registra con RUT y datos personales
2. **Requerimiento por Voz**: Graba audio "Necesito instalar un tablero eléctrico trifásico"
3. **Procesamiento IA**: Sistema transcribe y clasifica el requerimiento
4. **Cotización Automática**: Se genera cotización preliminar basada en normativas SEC
5. **Asignación de Técnico**: Sistema asigna técnico certificado disponible
6. **Diagnóstico**: Técnico realiza visita y genera reporte técnico
7. **Ejecución**: Trabajo realizado con fotos y validaciones
8. **Certificación**: Generación automática de certificado TE1/TC6
9. **Seguimiento**: Cliente recibe documentos y puede dar feedback

### Ejemplo de Cotización Generada

```json
{
  "quotationNumber": "COT-202412-0001",
  "serviceType": "Instalación Nueva",
  "installationCategory": "Domiciliaria Compleja",
  "connectionType": "Trifásico",
  "voltage": 380,
  "costs": {
    "materials": 450000,
    "labor": 280000,
    "certifications": {
      "te1": 45000
    },
    "subtotal": 775000,
    "tax": 147250,
    "total": 922250
  },
  "estimatedTime": {
    "total": 12
  },
  "validUntil": "2024-01-15T00:00:00.000Z"
}
```

## 🧪 Testing

### Configuración de Pruebas
```bash
# Ejecutar todas las pruebas
npm test

# Pruebas con cobertura
npm run test:coverage

# Pruebas de integración
npm run test:integration
```

### Ejemplos de Pruebas
```javascript
// Prueba de autenticación
describe('Auth API', () => {
  test('should login with valid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });
});
```

## 🚀 Despliegue

### Producción con Docker
```dockerfile
# Dockerfile ejemplo
FROM node:16-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 5000
CMD ["npm", "start"]
```

### Variables de Entorno de Producción
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/db
JWT_SECRET=secure_jwt_secret_here
# ... otras variables
```

## 📈 Monitoreo y Analytics

### Métricas Implementadas
- Tiempo de respuesta de APIs
- Uso de funciones de IA
- Satisfacción del cliente
- Cumplimiento normativo
- Productividad de técnicos

### Dashboards Disponibles
- Panel de administración
- Métricas de negocio
- Monitoreo técnico
- Reportes SEC automáticos

## 🤝 Contribución

### Estructura de Commits
```
feat: nueva funcionalidad
fix: corrección de bug
docs: actualización de documentación
style: cambios de formato
refactor: refactorización de código
test: nuevas pruebas
chore: tareas de mantenimiento
```

### Pull Request Process
1. Fork del repositorio
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'feat: agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Crear Pull Request

## 📄 Licencia

Este proyecto está licenciado bajo la Licencia MIT - ver el archivo [LICENSE](LICENSE) para detalles.

## 📞 Soporte

Para soporte técnico o consultas sobre normativas SEC:
- **Email**: soporte@servicioselectricos.cl
- **Teléfono**: +56 2 2XXX XXXX
- **Documentación**: [docs.servicioselectricos.cl](https://docs.servicioselectricos.cl)

## 🔄 Roadmap

### Próximas Funcionalidades
- [ ] App móvil nativa (React Native)
- [ ] Integración con sistemas de facturación
- [ ] Machine Learning para predicción de fallas
- [ ] API pública para integraciones
- [ ] Soporte multi-idioma
- [ ] Realidad aumentada para diagnósticos

---

**Desarrollado con ❤️ para la comunidad eléctrica de Chile 🇨🇱**
