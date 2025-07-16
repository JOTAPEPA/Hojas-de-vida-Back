import User from "../Models/user.js";
import { generateDownloadUrl, generateDirectUrl, deleteFile } from "../utils/cloudinaryUtils.js";

const httpUser = {

    postUser: async (req, res) => {
        try {
            const {
                Identificacion,
                Nombre,
                Apellido,
                Correo,
                Telefono,
                FechaNacimiento,
                Eps,
                Arl,
                Estrato,
                Estado,
                CertificadoEstudio,
                Edad,
                Hijos,
                EstadoCivil,
                TipoSangre,
                TipoContrato,
                CopiaContrato,
                FechaInicioContrato,
                FechaFinContrato,
                CajaCompensacion,
                FondoPension,
                PerfilProfesional,
                UltimoPeriodoVacacional,
                ControlAusentismo,
                EvaluacionDesempeño,
                Cargo,
                Sueldo,
                FechaIngresoEmpresa,
                Ciudad,
                Sede,
                Sanciones,
                Observaciones
            } = req.body;

            const newUser = new User({
                Identificacion,
                Nombre,
                Apellido,
                Correo,
                Telefono,
                FechaNacimiento,
                Eps,
                Arl,
                Estrato,
                Estado,
                CertificadoEstudio,
                Edad,
                Hijos,
                EstadoCivil,
                TipoSangre,
                TipoContrato,
                CopiaContrato,
                FechaInicioContrato,
                FechaFinContrato,
                CajaCompensacion,
                FondoPension,
                PerfilProfesional,
                UltimoPeriodoVacacional,
                ControlAusentismo,
                EvaluacionDesempeño,
                Cargo,
                Sueldo,
                FechaIngresoEmpresa,
                Ciudad,
                Sede,
                Sanciones,
                Observaciones,

            });

            const savedUser = await newUser.save();
            res.status(201).json({
                message: "Usuario creado exitosamente",
                user: savedUser
            });
        } catch (err) {
            console.error("Error al crear el usuario:", err);
            res.status(500).json({ 
                message: "Error al crear el usuario",
                error: err.message 
            });
        }
    },

    getListarTodos: async (req, res) => {
        try {
            const listarTodos = await User.find();
            res.json(listarTodos);
        } catch (error) {
            res.status(500).json({ error: "Error al obtener la lista de usuarios" });
            console.log("Error al obtener la lista de usuarios:", error);

        }
    },

    putUpdateUser: async (req, res) => {
        try {
            const { id } = req.params;
            const {
                Identificacion,
                Nombre,
                Apellido,
                Correo,
                Telefono,
                FechaNacimiento,
                Eps,
                Arl,
                Estrato,
                Estado,
                CertificadoEstudio,
                Edad,
                Hijos,
                EstadoCivil,
                TipoSangre,
                TipoContrato,
                CopiaContrato,
                FechaInicioContrato,
                FechaFinContrato,
                CajaCompensacion,
                FondoPension,
                PerfilProfesional,
                UltimoPeriodoVacacional,
                ControlAusentismo,
                EvaluacionDesempeño,
                Cargo,
                Sueldo,
                FechaIngresoEmpresa,
                Ciudad,
                Sede,
                Sanciones,
                Observaciones
              
            } = req.body;

            let update = {
                Identificacion,
                Nombre,
                Apellido,
                Correo,
                Telefono,
                FechaNacimiento,
                Eps,
                Arl,
                Estrato,
                Estado,
                CertificadoEstudio,
                Edad,
                Hijos,
                EstadoCivil,
                TipoSangre,
                TipoContrato,
                CopiaContrato,
                FechaInicioContrato,
                FechaFinContrato,
                CajaCompensacion,
                FondoPension,
                PerfilProfesional,
                UltimoPeriodoVacacional,
                ControlAusentismo,
                EvaluacionDesempeño,
                Cargo,
                Sueldo,
                FechaIngresoEmpresa,
                Ciudad,
                Sede,
                Sanciones,
                Observaciones
                
            };

            const modifiedUser = await User.findByIdAndUpdate(id, update, { new: true });
            
            if (!modifiedUser) {
                return res.status(404).json({ 
                    message: "Usuario no encontrado" 
                });
            }

            res.json({
                message: "Usuario actualizado exitosamente",
                user: modifiedUser
            });
        } catch (error) {
            console.error("Error al actualizar el usuario:", error);
            res.status(500).json({ 
                message: "Error al actualizar el usuario",
                error: error.message 
            });
        }
    },
    
    putModificarInactivo: async (req, res) => {
        try {
            const { id } = req.params;
            const modifiedUser = await User.findByIdAndUpdate(id, { Estado: 0 }, { new: true });
            
            if (!modifiedUser) {
                return res.status(404).json({ 
                    message: "Usuario no encontrado" 
                });
            }

            res.json({
                message: "Usuario desactivado exitosamente",
                user: modifiedUser
            });
        } catch(error) {
            console.error("Error al modificar el estado del usuario:", error);
            res.status(500).json({ 
                message: "Error al modificar el estado del usuario",
                error: error.message 
            });
        }
    },

    putModificarActivo: async (req, res) => {
        try {
            const { id } = req.params;
            const modifiedUser = await User.findByIdAndUpdate(id, { Estado: 1 }, { new: true });
            
            if (!modifiedUser) {
                return res.status(404).json({ 
                    message: "Usuario no encontrado" 
                });
            }

            res.json({
                message: "Usuario activado exitosamente",
                user: modifiedUser
            });           
        } catch(error) {
            console.error("Error al modificar el estado del usuario:", error);
            res.status(500).json({ 
                message: "Error al modificar el estado del usuario",
                error: error.message 
            });
        }
    },

    // Función para actualizar documentos específicos de un usuario
    putUpdateDocuments: async (req, res) => {
        try {
            const { id } = req.params;
            const { DocumentUrls } = req.body;

            // Validar que se proporcionen documentos
            if (!DocumentUrls) {
                return res.status(400).json({
                    message: "No se proporcionaron documentos para actualizar"
                });
            }

            const updatedUser = await User.findByIdAndUpdate(
                id, 
                { $set: { DocumentUrls } }, 
                { new: true }
            );

            if (!updatedUser) {
                return res.status(404).json({ 
                    message: "Usuario no encontrado" 
                });
            }

            res.json({
                message: "Documentos actualizados exitosamente",
                user: updatedUser
            });
        } catch (error) {
            console.error("Error al actualizar documentos:", error);
            res.status(500).json({ 
                message: "Error al actualizar documentos",
                error: error.message 
            });
        }
    },

    // Función para obtener solo los documentos de un usuario
    getDocumentsByUserId: async (req, res) => {
        try {
            const { id } = req.params;
            
            const user = await User.findById(id, 'DocumentUrls Nombre Apellido Identificacion');
            
            if (!user) {
                return res.status(404).json({ 
                    message: "Usuario no encontrado" 
                });
            }

            res.json({
                message: "Documentos obtenidos exitosamente",
                user: {
                    _id: user._id,
                    Nombre: user.Nombre,
                    Apellido: user.Apellido,
                    Identificacion: user.Identificacion,
                    DocumentUrls: user.DocumentUrls
                }
            });
        } catch (error) {
            console.error("Error al obtener documentos:", error);
            res.status(500).json({ 
                message: "Error al obtener documentos",
                error: error.message 
            });
        }
    },
}

export default httpUser;