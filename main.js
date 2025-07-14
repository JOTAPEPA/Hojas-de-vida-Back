import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

dotenv.config(); // Cargar las variables de entorno desde el archivo .env

// Rutas
import httpUser from './Routes/user.js';

const app = express();
app.use(cors());
app.use(express.json());
app.use("/api/user", httpUser);

// === Configuración de Cloudinary ===
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// === Configuración de Multer + Cloudinary ===
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    resource_type: 'auto', // Soporta imágenes, PDFs, etc.
  },
});

const upload = multer({ storage });

// Ruta de prueba para subir archivo
app.post('/api/upload', upload.single('archivo'), (req, res) => {
  res.json({
    url: req.file.path,
    nombre: req.file.originalname,
    tipo: req.file.mimetype,
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
connectToMongoDB()
  .then(() => {
    console.log("Conexión a la base de datos exitosa");
    app.listen(3999, () => {
      console.log("Servidor escuchando en el puerto 3999");
    });
  })
  .catch(err => {
    console.error('Error al conectar a MongoDB Atlas:', err.message);
    process.exit(1);
  });
