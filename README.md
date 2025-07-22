# Hojas de Vida Backend API

API backend para el sistema de gestión de hojas de vida.

## 🚀 Deployment en Render

### Variables de entorno requeridas:

```
MONGO_URI=mongodb+srv://usuario:password@cluster.mongodb.net/database_name
CLOUD_NAME=tu_cloud_name_de_cloudinary
API_KEY=tu_api_key_de_cloudinary
API_SECRET=tu_api_secret_de_cloudinary
NODE_ENV=production
```

### Configuración en Render:

1. **Build Command**: `npm install`
2. **Start Command**: `npm start`
3. **Node Version**: 18+

### Endpoints principales:

- `GET /` - Estado del servidor
- `GET /health` - Salud del servidor
- `POST /api/user` - Crear usuario
- `GET /api/user` - Listar usuarios
- `PUT /api/user/:id` - Actualizar usuario
- `POST /api/upload` - Subir archivo
- `POST /api/upload-multiple` - Subir múltiples archivos
- `DELETE /api/delete/:publicId` - Eliminar archivo

## 🔧 Desarrollo local

```bash
npm install
npm run dev
```

## 📝 Notas importantes

- El servidor se adapta automáticamente al puerto asignado por Render
- Los archivos se suben a Cloudinary
- Se requiere conexión a MongoDB Atlas
- Los PDFs se manejan como recursos 'raw' en Cloudinary
