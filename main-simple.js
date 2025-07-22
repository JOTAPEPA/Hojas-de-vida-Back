import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

// Verificar variables de entorno críticas
console.log('🔍 Verificando variables de entorno...');
const requiredEnvVars = ['MONGO_URI', 'CLOUD_NAME', 'API_KEY', 'API_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingEnvVars);
  console.log('📝 Asegúrate de configurar estas variables en Render');
} else {
  console.log('✅ Todas las variables de entorno están configuradas');
}

// Rutas
import httpUser from './Routes/user.js';

const app = express();
app.use(cors());
app.use(express.json());

// Ruta raíz para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Servidor de Hojas de Vida API funcionando correctamente',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Ruta de salud del servidor
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.use("/api/user", httpUser);

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/user',
      'GET /api/user',
      'PUT /api/user/:id'
    ]
  });
});

// Middleware global para manejo de errores
app.use((error, req, res, next) => {
  console.error('Error no manejado:', error);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Error interno'
  });
});

// === Conexión a MongoDB y servidor ===
const MONGO_URI = process.env.MONGO_URI;

// Función para conectar a MongoDB con reintentos
async function connectToMongoDB() {
  const maxRetries = 3;
  let retries = 0;

  const connectionOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 75000,
  };

  while (retries < maxRetries) {
    try {
      await mongoose.connect(MONGO_URI, connectionOptions);
      console.log("Conexión a la base de datos exitosa");
      return;
    } catch (error) {
      retries++;
      console.log(`Intento ${retries} fallido. Error:`, error.message);
      
      if (retries === maxRetries) {
        console.error('Error al conectar a MongoDB Atlas después de', maxRetries, 'intentos');
        throw error;
      }
      
      // Esperar 2 segundos antes del siguiente intento
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}

// Iniciar conexión y servidor
console.log('🚀 Iniciando servidor...');
connectToMongoDB()
  .then(() => {
    console.log("✅ Conexión a la base de datos exitosa");
    const PORT = process.env.PORT || 3999;
    app.listen(PORT, () => {
      console.log(`🌐 Servidor escuchando en el puerto ${PORT}`);
      console.log(`📱 Modo: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔗 URL local: http://localhost:${PORT}`);
    });
  })
  .catch(err => {
    console.error('❌ Error al conectar a MongoDB Atlas:', err.message);
    process.exit(1);
  });
