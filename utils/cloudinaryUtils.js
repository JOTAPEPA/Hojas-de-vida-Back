import { v2 as cloudinary } from 'cloudinary';

/**
 * Genera una URL de descarga segura para un archivo en Cloudinary
 * @param {string} publicId - ID público del archivo en Cloudinary
 * @param {string} fileName - Nombre del archivo para la descarga
 * @param {string} resourceType - Tipo de recurso (auto, image, video, raw)
 * @param {boolean} isPDF - Si es un archivo PDF
 * @returns {string} URL de descarga
 */
export const generateDownloadUrl = (publicId, fileName = null, resourceType = 'auto', isPDF = false) => {
  try {
    // Para PDFs, usar resource_type 'raw' y configuración especial
    const baseConfig = {
      resource_type: isPDF ? 'raw' : resourceType,
      type: 'upload',
      secure: true
    };

    // Para PDFs, agregar flag de attachment para forzar descarga
    if (isPDF) {
      baseConfig.flags = 'attachment';
    }

    const baseUrl = cloudinary.url(publicId, baseConfig);

    // Si se proporciona un nombre de archivo, agregarlo como parámetro
    if (fileName) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}fl_attachment=${encodeURIComponent(fileName)}`;
    }

    return baseUrl;
  } catch (error) {
    console.error('Error al generar URL de descarga:', error);
    throw new Error('Error al generar URL de descarga');
  }
};

/**
 * Genera una URL directa (para visualización) de un archivo en Cloudinary
 * @param {string} publicId - ID público del archivo en Cloudinary
 * @param {string} resourceType - Tipo de recurso (auto, image, video, raw)
 * @param {boolean} isPDF - Si es un archivo PDF
 * @returns {string} URL directa
 */
export const generateDirectUrl = (publicId, resourceType = 'auto', isPDF = false) => {
  try {
    return cloudinary.url(publicId, {
      resource_type: isPDF ? 'raw' : resourceType,
      type: 'upload',
      secure: true
    });
  } catch (error) {
    console.error('Error al generar URL directa:', error);
    throw new Error('Error al generar URL directa');
  }
};

/**
 * Elimina un archivo de Cloudinary
 * @param {string} publicId - ID público del archivo en Cloudinary
 * @param {string} resourceType - Tipo de recurso (auto, image, video, raw)
 * @returns {Promise<Object>} Resultado de la eliminación
 */
export const deleteFile = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });

    return {
      success: result.result === 'ok',
      result: result
    };
  } catch (error) {
    console.error('Error al eliminar archivo:', error);
    throw new Error('Error al eliminar archivo de Cloudinary');
  }
};

/**
 * Obtiene información de un archivo en Cloudinary
 * @param {string} publicId - ID público del archivo
 * @param {string} resourceType - Tipo de recurso
 * @returns {Promise<Object>} Información del archivo
 */
export const getFileInfo = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.api.resource(publicId, {
      resource_type: resourceType
    });

    return {
      success: true,
      info: {
        public_id: result.public_id,
        url: result.secure_url,
        size: result.bytes,
        format: result.format,
        created_at: result.created_at,
        width: result.width,
        height: result.height
      }
    };
  } catch (error) {
    console.error('Error al obtener información del archivo:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Valida que un archivo sea accesible públicamente
 * @param {string} publicId - ID público del archivo
 * @param {string} resourceType - Tipo de recurso
 * @returns {Promise<boolean>} True si es accesible
 */
export const validateFileAccess = async (publicId, resourceType = 'auto') => {
  try {
    const info = await getFileInfo(publicId, resourceType);
    return info.success;
  } catch (error) {
    console.error('Error al validar acceso al archivo:', error);
    return false;
  }
};

/**
 * Detecta si un archivo es PDF basado en su nombre o tipo MIME
 * @param {string} filename - Nombre del archivo
 * @param {string} mimetype - Tipo MIME del archivo
 * @returns {boolean} True si es PDF
 */
export const isPDFFile = (filename, mimetype = '') => {
  const extension = filename ? filename.toLowerCase().split('.').pop() : '';
  return extension === 'pdf' || mimetype === 'application/pdf';
};

/**
 * Genera URLs específicas para PDFs con mejor compatibilidad
 * @param {string} publicId - ID público del archivo
 * @param {string} filename - Nombre del archivo
 * @returns {Object} URLs para descarga y visualización
 */
export const generatePDFUrls = (publicId, filename) => {
  try {
    // URL para descarga directa
    const downloadUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      secure: true,
      flags: 'attachment'
    });

    // URL para visualización en navegador
    const viewUrl = cloudinary.url(publicId, {
      resource_type: 'raw',
      type: 'upload',
      secure: true
    });

    // URL con nombre personalizado para descarga
    const namedDownloadUrl = filename ? 
      `${downloadUrl}?fl_attachment=${encodeURIComponent(filename)}` : 
      downloadUrl;

    return {
      download: namedDownloadUrl,
      view: viewUrl,
      direct: viewUrl
    };
  } catch (error) {
    console.error('Error al generar URLs para PDF:', error);
    throw new Error('Error al generar URLs para PDF');
  }
};

export default {
  generateDownloadUrl,
  generateDirectUrl,
  deleteFile,
  getFileInfo,
  validateFileAccess,
  isPDFFile,
  generatePDFUrls
};
