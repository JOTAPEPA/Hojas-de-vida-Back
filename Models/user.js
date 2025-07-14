import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
    Identificacion: { type: String, required: true, unique: true },
    Nombre: { type: String, required: true },
    Apellido: { type: String, required: true },
    Correo: { type: String, required: true, unique: true },
    Telefono: { type: String, required: true },
    FechaNacimiento: { type: Date, required: true },
    Eps: { type: String, required: true },
    Arl: { type: String, required: true },
    Estrato: { type: String, required: true },
    Estado: { type: Number, default: 1 }, // 1: activo, 0: inactivo 
    CertificadoEstudio: { type: String },
    Edad: { type: Number, required: true },
    Hijos: { type: Number, required: true },
    EstadoCivil: { type: String, required: true },
    TipoSangre: { type: String, required: true },
    TipoContrato: { type: String, required: true },
    CopiaContrato: { type: String },
    FechaInicioContrato: { type: Date, required: true },
    FechaFinContrato: { type: Date, required: true },
    CajaCompensacion: { type: String, required: true },
    FondoPension: { type: String, required: true },
    PerfilProfesional: { type: String, required: true },
    UltimoPeriodoVacacional: { type: Date, required: true },
    ControlAusentismo: { type: String },
    EvaluacionDesempeño: { type: String, required: true }, 
    Cargo: { type: String, required: true },
    Sueldo: { type: Number, required: true },
    FechaIngresoEmpresa: { type: Date, required: true },
    Ciudad: { type: String, required: true },
    Sede: { type: String, required: true },
    Sanciones: { type: String },
    
}, {
    timestamps: true // Esto agregará automáticamente createdAt y updatedAt
});

export default mongoose.model('User', userSchema);