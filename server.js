const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const quotationRoutes = require('./routes/quotations');
const reportRoutes = require('./routes/reports');
const chatbotRoutes = require('./routes/chatbot');
const speechRoutes = require('./routes/speech');
const techniciansRoutes = require('./routes/technicians');

// Importar middleware personalizado
const errorHandler = require('./middleware/errorHandler');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? process.env.CLIENT_URL 
      : "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ Conectado a MongoDB'))
.catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Middleware de seguridad
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.openai.com", "https://speech.googleapis.com"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) * 60 * 1000, // 15 minutos
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS), // 100 requests por ventana
  message: {
    error: 'Demasiadas solicitudes desde esta IP, intente nuevamente más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);
app.use(compression());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CLIENT_URL 
    : "http://localhost:3000",
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/quotations', authMiddleware, quotationRoutes);
app.use('/api/reports', authMiddleware, reportRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/speech', authMiddleware, speechRoutes);
app.use('/api/technicians', authMiddleware, techniciansRoutes);

// Ruta de salud
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0'
  });
});

// Configuración de Socket.IO para chat en tiempo real
io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado:', socket.id);

  // Unirse a sala específica (cliente o técnico)
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    console.log(`Usuario ${socket.id} se unió a la sala ${roomId}`);
  });

  // Manejar mensajes de chat
  socket.on('send-message', (data) => {
    io.to(data.roomId).emit('receive-message', {
      id: Date.now(),
      message: data.message,
      sender: data.sender,
      timestamp: new Date(),
      type: data.type || 'text'
    });
  });

  // Notificar estado de tipeo
  socket.on('typing', (data) => {
    socket.to(data.roomId).emit('user-typing', {
      userId: data.userId,
      isTyping: data.isTyping
    });
  });

  // Manejar desconexión
  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id);
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en puerto ${PORT}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`📱 Socket.IO habilitado para chat en tiempo real`);
});

// Manejar cierre graceful del servidor
process.on('SIGTERM', () => {
  console.log('🛑 Recibida señal SIGTERM, cerrando servidor...');
  server.close(() => {
    console.log('✅ Servidor cerrado correctamente');
    mongoose.connection.close();
  });
});

module.exports = app;