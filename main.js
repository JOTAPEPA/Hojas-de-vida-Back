import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { fileFilter, handleUploadError, generateUniqueFileName } from './middleware/fileValidation.js';

dotenv.config(); // Cargar las variables de entorno desde el archivo .env

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

app.use("/api/user", httpUser);

// Middleware para manejar errores de subida de archivos
app.use(handleUploadError);

// === Configuración de Cloudinary ===
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// === Configuración de Multer + Cloudinary ===
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    // Configuración específica según el tipo de archivo
    const isPDF = file.mimetype === 'application/pdf';
    const isImage = file.mimetype.startsWith('image/');
    
    return {
      folder: 'uploads',
      resource_type: isPDF ? 'raw' : 'auto', // PDFs como 'raw', otros como 'auto'
      public_id: generateUniqueFileName(file.originalname, file.fieldname),
      // Para PDFs, configuración sin restricciones de acceso
      ...(isPDF && {
        format: 'pdf'
      })
    };
  },
});

const upload = multer({ 
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 10 // máximo 10 archivos
  }
});

// Función alternativa para subir PDFs directamente (sin access control)
async function uploadPDFDirect(filePath, originalName) {
  return new Promise((resolve, reject) => {
    cloudinary.uploader.upload(filePath, {
      resource_type: "raw",
      folder: "uploads",
      public_id: generateUniqueFileName(originalName, 'pdf'),
      // Sin access_mode para evitar bloqueos de entrega
    }, (error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
  });
}

// Ruta de prueba para subir archivo
app.post('/api/upload', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo'
      });
    }

    const isPDF = req.file.mimetype === 'application/pdf';
    
    const response = {
      success: true,
      url: req.file.path,
      public_id: req.file.public_id,
      nombre: req.file.originalname,
      tipo: req.file.mimetype,
      size: req.file.bytes,
      secure_url: req.file.secure_url,
      isPDF: isPDF,
      resource_type: isPDF ? 'raw' : 'auto'
    };

    // Si es PDF, agregar URLs específicas
    if (isPDF) {
      try {
        const { generatePDFUrls } = await import('./utils/cloudinaryUtils.js');
        const pdfUrls = generatePDFUrls(req.file.public_id, req.file.originalname);
        response.pdfUrls = pdfUrls;
      } catch (urlError) {
        console.warn('Error al generar URLs de PDF:', urlError);
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Error al subir archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir archivo',
      error: error.message
    });
  }
});

// Ruta alternativa para subir PDFs sin restricciones de acceso
app.post('/api/upload-pdf-direct', upload.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionó ningún archivo PDF'
      });
    }

    const isPDF = req.file.mimetype === 'application/pdf';
    
    if (!isPDF) {
      return res.status(400).json({
        success: false,
        message: 'Solo se permiten archivos PDF en esta ruta'
      });
    }

    // Usar la función de subida directa para evitar problemas de access control
    const directUploadResult = await uploadPDFDirect(req.file.path, req.file.originalname);
    
    const response = {
      success: true,
      url: directUploadResult.secure_url,
      public_id: directUploadResult.public_id,
      nombre: req.file.originalname,
      tipo: req.file.mimetype,
      size: directUploadResult.bytes,
      secure_url: directUploadResult.secure_url,
      isPDF: true,
      resource_type: 'raw',
      upload_method: 'direct' // Indicar que se usó el método directo
    };

    // Agregar URLs específicas para PDFs
    try {
      const { generatePDFUrls } = await import('./utils/cloudinaryUtils.js');
      const pdfUrls = generatePDFUrls(directUploadResult.public_id, req.file.originalname);
      response.pdfUrls = pdfUrls;
    } catch (urlError) {
      console.warn('Error al generar URLs de PDF:', urlError);
    }

    res.json(response);
  } catch (error) {
    console.error('Error al subir PDF directamente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir PDF',
      error: error.message
    });
  }
});

// Ruta para subir múltiples archivos
app.post('/api/upload-multiple', upload.array('archivos', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron archivos'
      });
    }

    const uploadedFiles = await Promise.all(req.files.map(async (file) => {
      const isPDF = file.mimetype === 'application/pdf';
      
      const fileData = {
        url: file.path,
        public_id: file.public_id,
        nombre: file.originalname,
        tipo: file.mimetype,
        size: file.bytes,
        secure_url: file.secure_url,
        isPDF: isPDF,
        resource_type: isPDF ? 'raw' : 'auto'
      };

      // Si es PDF, agregar URLs específicas
      if (isPDF) {
        try {
          const { generatePDFUrls } = await import('./utils/cloudinaryUtils.js');
          const pdfUrls = generatePDFUrls(file.public_id, file.originalname);
          fileData.pdfUrls = pdfUrls;
        } catch (urlError) {
          console.warn('Error al generar URLs de PDF para archivo múltiple:', urlError);
        }
      }

      return fileData;
    }));

    res.json({
      success: true,
      files: uploadedFiles,
      count: uploadedFiles.length
    });
  } catch (error) {
    console.error('Error al subir archivos múltiples:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al subir archivos',
      error: error.message
    });
  }
});

// Ruta para generar URL de descarga segura
app.get('/api/download/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { fileName, fileType } = req.query;
    
    // Detectar si es PDF
    const isPDF = fileType === 'pdf' || (fileName && fileName.toLowerCase().endsWith('.pdf'));
    
    if (isPDF) {
      // Usar la función específica para PDFs
      const { generatePDFUrls } = await import('./utils/cloudinaryUtils.js');
      const urls = generatePDFUrls(publicId, fileName);
      
      return res.json({
        success: true,
        isPDF: true,
        downloadUrl: urls.download,
        viewUrl: urls.view,
        directUrl: urls.direct
      });
    } else {
      // Para otros tipos de archivo
      const downloadUrl = cloudinary.url(publicId, {
        resource_type: 'auto',
        type: 'upload',
        flags: 'attachment'
      });

      const finalUrl = fileName ? 
        `${downloadUrl}&fl_attachment=${encodeURIComponent(fileName)}` : 
        downloadUrl;

      return res.json({
        success: true,
        isPDF: false,
        downloadUrl: finalUrl,
        directUrl: cloudinary.url(publicId, {
          resource_type: 'auto',
          type: 'upload'
        })
      });
    }
  } catch (error) {
    console.error('Error al generar URL de descarga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al generar URL de descarga',
      error: error.message
    });
  }
});

// Ruta para eliminar archivo de Cloudinary
app.delete('/api/delete/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { resourceType } = req.query; // Permitir especificar el resource_type
    
    // Si no se especifica resourceType, intentar con 'auto' primero, luego 'raw'
    let result;
    
    if (resourceType) {
      // Si se especifica el tipo de recurso, usarlo directamente
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: resourceType
      });
    } else {
      // Intentar primero con 'auto'
      try {
        result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'auto'
        });
        
        // Si no se encontró con 'auto', intentar con 'raw' (para PDFs)
        if (result.result === 'not found') {
          result = await cloudinary.uploader.destroy(publicId, {
            resource_type: 'raw'
          });
        }
      } catch (error) {
        // Si falla con 'auto', intentar con 'raw'
        result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'raw'
        });
      }
    }

    if (result.result === 'ok') {
      res.json({
        success: true,
        message: 'Archivo eliminado exitosamente',
        result: result
      });
    } else {
      res.status(400).json({
        success: false,
        message: 'No se pudo eliminar el archivo',
        result: result
      });
    }
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor al eliminar archivo',
      error: error.message
    });
  }
});

// Ruta específica para manejar PDFs
app.get('/api/pdf/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    const { fileName, action = 'view' } = req.query;
    
    const { generatePDFUrls } = await import('./utils/cloudinaryUtils.js');
    const urls = generatePDFUrls(publicId, fileName);
    
    if (action === 'download') {
      // Redirigir directamente a la URL de descarga
      return res.redirect(urls.download);
    } else {
      // Para visualización, devolver la URL
      return res.json({
        success: true,
        message: 'URLs de PDF generadas exitosamente',
        urls: urls,
        publicId: publicId
      });
    }
  } catch (error) {
    console.error('Error al manejar PDF:', error);
    res.status(500).json({
      success: false,
      message: 'Error al manejar archivo PDF',
      error: error.message
    });
  }
});

// Ruta para obtener información de archivo y determinar tipo
app.get('/api/file-info/:publicId', async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Intentar obtener info como 'auto' primero
    let fileInfo = null;
    let resourceType = 'auto';
    
    try {
      fileInfo = await cloudinary.api.resource(publicId, {
        resource_type: 'auto'
      });
    } catch (autoError) {
      // Si falla con 'auto', intentar con 'raw' (para PDFs)
      try {
        fileInfo = await cloudinary.api.resource(publicId, {
          resource_type: 'raw'
        });
        resourceType = 'raw';
      } catch (rawError) {
        throw new Error('Archivo no encontrado en Cloudinary');
      }
    }
    
    const isPDF = fileInfo.format === 'pdf' || resourceType === 'raw';
    
    res.json({
      success: true,
      fileInfo: {
        public_id: fileInfo.public_id,
        url: fileInfo.secure_url,
        size: fileInfo.bytes,
        format: fileInfo.format,
        resource_type: resourceType,
        isPDF: isPDF,
        created_at: fileInfo.created_at
      }
    });
  } catch (error) {
    console.error('Error al obtener información del archivo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información del archivo',
      error: error.message
    });
  }
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

// Middleware para manejar rutas no encontradas
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.originalUrl} no encontrada`,
    availableRoutes: [
      'GET /',
      'GET /health',
      'POST /api/upload',
      'POST /api/upload-pdf-direct',
      'POST /api/upload-multiple',
      'GET /api/download/:publicId',
      'DELETE /api/delete/:publicId',
      'GET /api/pdf/:publicId',
      'GET /api/file-info/:publicId',
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
