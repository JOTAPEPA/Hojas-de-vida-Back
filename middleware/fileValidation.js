/**
 * Middleware para validar archivos subidos
 */

// Tipos de archivo permitidos
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/gif',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
];

// Tamaño máximo de archivo (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Valida el tipo de archivo
 * @param {Object} file - Archivo de multer
 * @returns {boolean} True si es válido
 */
export const validateFileType = (file) => {
  return ALLOWED_MIME_TYPES.includes(file.mimetype);
};

/**
 * Valida el tamaño del archivo
 * @param {Object} file - Archivo de multer
 * @returns {boolean} True si es válido
 */
export const validateFileSize = (file) => {
  return file.size <= MAX_FILE_SIZE;
};

/**
 * Middleware de validación de archivos para multer
 * @param {Object} req - Request object
 * @param {Object} file - File object
 * @param {Function} cb - Callback function
 */
export const fileFilter = (req, file, cb) => {
  // Validar tipo de archivo
  if (!validateFileType(file)) {
    const error = new Error('Tipo de archivo no permitido. Formatos permitidos: JPG, PNG, GIF, PDF, DOC, DOCX, XLS, XLSX');
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Validar tamaño (esto también se hace en multer limits, pero es buena práctica validar aquí)
  if (file.size && !validateFileSize(file)) {
    const error = new Error('Archivo demasiado grande. Tamaño máximo permitido: 10MB');
    error.code = 'FILE_TOO_LARGE';
    return cb(error, false);
  }

  cb(null, true);
};

/**
 * Sanitiza el nombre del archivo
 * @param {string} filename - Nombre original del archivo
 * @returns {string} Nombre sanitizado
 */
export const sanitizeFileName = (filename) => {
  // Remover caracteres especiales y espacios
  return filename
    .replace(/[^a-zA-Z0-9.-]/g, '_')
    .replace(/_{2,}/g, '_')
    .toLowerCase();
};

/**
 * Genera un nombre único para el archivo
 * @param {string} originalName - Nombre original
 * @param {string} fieldName - Nombre del campo
 * @returns {string} Nombre único
 */
export const generateUniqueFileName = (originalName, fieldName = 'file') => {
  const timestamp = Date.now();
  const random = Math.round(Math.random() * 1E9);
  const extension = originalName.split('.').pop();
  const sanitizedName = sanitizeFileName(originalName.split('.')[0]);
  
  return `${fieldName}_${sanitizedName}_${timestamp}_${random}.${extension}`;
};

/**
 * Middleware para manejar errores de subida de archivos
 * @param {Error} error - Error object
 * @param {Object} req - Request object
 * @param {Object} res - Response object
 * @param {Function} next - Next middleware
 */
export const handleUploadError = (error, req, res, next) => {
  if (error) {
    let message = 'Error al subir archivo';
    let statusCode = 400;

    switch (error.code) {
      case 'INVALID_FILE_TYPE':
        message = error.message;
        break;
      case 'FILE_TOO_LARGE':
      case 'LIMIT_FILE_SIZE':
        message = 'Archivo demasiado grande. Tamaño máximo permitido: 10MB';
        break;
      case 'LIMIT_FILE_COUNT':
        message = 'Demasiados archivos. Máximo permitido: 10 archivos';
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = 'Campo de archivo inesperado';
        break;
      default:
        message = error.message || 'Error desconocido al subir archivo';
        statusCode = 500;
    }

    return res.status(statusCode).json({
      success: false,
      message: message,
      error: error.code || 'UPLOAD_ERROR'
    });
  }

  next();
};

export default {
  validateFileType,
  validateFileSize,
  fileFilter,
  sanitizeFileName,
  generateUniqueFileName,
  handleUploadError,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE
};
