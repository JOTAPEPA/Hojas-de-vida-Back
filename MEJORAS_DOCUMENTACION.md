# Documentación de Mejoras para Descarga de Archivos PDF

## Problema Solucionado

El error 401 (Unauthorized) al intentar descargar archivos PDF desde Cloudinary se debía a una configuración incorrecta en la subida y acceso a los archivos.

## Cambios Realizados

### 1. Configuración de Cloudinary Mejorada (`main.js`)

```javascript
// === Configuración de Multer + Cloudinary ===
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'uploads',
    resource_type: 'auto', // Soporta imágenes, PDFs, etc.
    access_mode: "public", // Permite acceso público
    type: "upload", // Tipo de subida
    public_id: (req, file) => {
      // Generar un ID único para el archivo
      return generateUniqueFileName(file.originalname, file.fieldname);
    }
  },
});
```
 
### 2. Nuevas Rutas de API

#### Subir archivo único
```
POST /api/upload
```

#### Subir múltiples archivos
```
POST /api/upload-multiple
```

#### Generar URL de descarga segura
```
GET /api/download/:publicId?fileName=nombre_archivo.pdf
```

#### Eliminar archivo de Cloudinary
```
DELETE /api/delete/:publicId
```

### 3. Modelo de Usuario Actualizado

Se agregó la estructura `DocumentUrls` para almacenar mejor información de documentos:

```javascript
DocumentUrls: {
    hojaVida: {
        url: { type: String },
        public_id: { type: String },
        filename: { type: String },
        uploadDate: { type: Date, default: Date.now }
    },
    cedula: {
        url: { type: String },
        public_id: { type: String },
        filename: { type: String },
        uploadDate: { type: Date, default: Date.now }
    },
    // ... más tipos de documentos
}
```

### 4. Utilidades de Cloudinary (`utils/cloudinaryUtils.js`)

Funciones para manejar archivos de manera más segura:

- `generateDownloadUrl()` - Genera URLs de descarga
- `generateDirectUrl()` - Genera URLs directas para visualización
- `deleteFile()` - Elimina archivos de Cloudinary
- `getFileInfo()` - Obtiene información de archivos
- `validateFileAccess()` - Valida acceso a archivos

### 5. Validación de Archivos (`middleware/fileValidation.js`)

Middleware para validar:

- Tipos de archivo permitidos
- Tamaño máximo (10MB)
- Sanitización de nombres de archivo
- Manejo de errores de subida

## Cómo Usar las Mejoras

### Para el Frontend

1. **Al subir archivos**, usar la nueva estructura de respuesta:

```javascript
// Respuesta mejorada del servidor
{
  success: true,
  url: "https://res.cloudinary.com/...",
  public_id: "archivo_id_unico",
  nombre: "archivo_original.pdf",
  tipo: "application/pdf",
  size: 1234567,
  secure_url: "https://res.cloudinary.com/..."
}
```

2. **Para descargar archivos**, usar la nueva ruta:

```javascript
// En lugar de usar directamente la URL de Cloudinary
const downloadUrl = await fetch(`/api/download/${public_id}?fileName=${fileName}`);
const { downloadUrl: secureUrl } = await downloadUrl.json();

// Usar secureUrl para la descarga
window.open(secureUrl, '_blank');
```

3. **Para gestionar documentos de usuarios**:

```javascript
// Obtener documentos de un usuario
GET /api/user/documents/:userId

// Actualizar documentos
PUT /api/user/documents/:userId
{
  "DocumentUrls": {
    "certificadoEstudios": {
      "url": "https://...",
      "public_id": "...",
      "filename": "certificado.pdf"
    }
  }
}
```

## Configuración de Cloudinary

Asegúrate de que tu cuenta de Cloudinary tenga:

1. **Configuración correcta en `.env`**:
```
CLOUD_NAME=tu_cloud_name
API_KEY=tu_api_key
API_SECRET=tu_api_secret
```

2. **Permisos de acceso público** habilitados en tu dashboard de Cloudinary

## Tipos de Archivos Soportados

- **Imágenes**: JPG, JPEG, PNG, GIF
- **Documentos**: PDF, DOC, DOCX
- **Hojas de cálculo**: XLS, XLSX
- **Tamaño máximo**: 10MB por archivo

## Seguridad

- Validación de tipos de archivo en el servidor
- Sanitización de nombres de archivo
- Límites de tamaño implementados
- Manejo seguro de errores
- URLs de descarga con tokens de acceso

## Testing

El servidor está ejecutándose en el puerto 3999. Puedes probar las nuevas rutas con herramientas como Postman o desde tu aplicación frontend.

### Ejemplo de prueba con curl:

```bash
# Subir un archivo
curl -X POST -F "archivo=@documento.pdf" http://localhost:3999/api/upload

# Obtener URL de descarga
curl http://localhost:3999/api/download/public_id_del_archivo?fileName=mi_documento.pdf
```

## Notas Importantes

1. **Migración de datos**: Los documentos existentes pueden necesitar migración a la nueva estructura
2. **Frontend**: Actualizar el código del frontend para usar las nuevas rutas y estructura de respuesta
3. **Monitoreo**: Revisar los logs para asegurar que las descargas funcionan correctamente
4. **Backup**: Hacer backup de la base de datos antes de aplicar cambios en producción

## Solución Específica para PDFs

### Problema Identificado
Los PDFs necesitan tratamiento especial en Cloudinary:
- Deben subirse como `resource_type: 'raw'` en lugar de `'auto'`
- Necesitan configuración específica para descarga
- Requieren URLs diferentes para visualización vs descarga

### Nuevas Rutas Específicas para PDFs

#### 1. Ruta específica para PDFs
```
GET /api/pdf/:publicId?fileName=archivo.pdf&action=view|download
```

**Ejemplos:**
```javascript
// Para visualizar PDF
GET /api/pdf/mi_archivo_id?fileName=documento.pdf

// Para descargar PDF
GET /api/pdf/mi_archivo_id?fileName=documento.pdf&action=download
```

#### 2. Información de archivo
```
GET /api/file-info/:publicId
```

Devuelve información completa del archivo incluyendo si es PDF.

### Configuración Mejorada para PDFs

La configuración de Cloudinary ahora detecta automáticamente PDFs:

```javascript
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    const isPDF = file.mimetype === 'application/pdf';
    
    return {
      folder: 'uploads',
      resource_type: isPDF ? 'raw' : 'auto', // PDFs como 'raw'
      access_mode: "public",
      type: "upload",
      public_id: generateUniqueFileName(file.originalname, file.fieldname),
      ...(isPDF && {
        format: 'pdf',
        flags: 'attachment'
      })
    };
  },
});
```

### Nuevas Funciones Utilitarias

#### `generatePDFUrls(publicId, filename)`
Genera URLs específicas para PDFs:

```javascript
{
  download: "URL para forzar descarga",
  view: "URL para visualización en navegador", 
  direct: "URL directa al archivo"
}
```

#### `isPDFFile(filename, mimetype)`
Detecta si un archivo es PDF basado en extensión o tipo MIME.

### Respuesta Mejorada de Subida

Al subir un PDF, la respuesta incluye:

```javascript
{
  success: true,
  url: "URL original",
  public_id: "ID único",
  nombre: "archivo.pdf",
  tipo: "application/pdf",
  isPDF: true,
  resource_type: "raw",
  pdfUrls: {
    download: "URL de descarga",
    view: "URL de visualización",
    direct: "URL directa"
  }
}
```

### Uso en el Frontend

#### Para subir PDFs:
```javascript
const formData = new FormData();
formData.append('archivo', pdfFile);

const response = await fetch('/api/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();

if (result.isPDF) {
  // Usar result.pdfUrls para manejar el PDF
  console.log('URL de descarga:', result.pdfUrls.download);
  console.log('URL de visualización:', result.pdfUrls.view);
}
```

#### Para descargar PDFs existentes:
```javascript
// Método 1: Usando la ruta específica de PDF
window.open(`/api/pdf/${publicId}?fileName=${fileName}&action=download`, '_blank');

// Método 2: Usando la ruta genérica con tipo
const response = await fetch(`/api/download/${publicId}?fileType=pdf&fileName=${fileName}`);
const result = await response.json();
window.open(result.downloadUrl, '_blank');
```

### Página de Prueba

Se incluyó un archivo `test-pdf.html` para probar todas las funcionalidades:
- Subida de archivos (PDFs e imágenes)
- Descarga de PDFs
- Visualización de PDFs
- Obtención de información de archivos

### Diferencias Importantes

| Característica | Imágenes | PDFs |
|----------------|----------|------|
| resource_type | auto | raw |
| Visualización | Directa en navegador | Depende del navegador |
| Descarga | Con parámetros adicionales | Configuración especial |
| URLs | Una sola URL | URLs separadas para ver/descargar |
