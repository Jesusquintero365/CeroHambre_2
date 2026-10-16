// ======================================================
// CONFIGURACIÓN (variables de entorno)
// ======================================================
// Lee primero el .env de la raíz del repositorio y luego Backend/.env.
// En producción (Render) las variables se definen en el panel de la
// plataforma; aquí nunca se escriben contraseñas ni llaves.

const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env'), quiet: true });
dotenv.config({ path: path.join(__dirname, '..', '.env'), quiet: true });

const esProduccion = process.env.NODE_ENV === 'production';

const config = {
    esProduccion,
    puerto: Number(process.env.PORT) || 3000,

    // Cadena de conexión de PostgreSQL
    databaseUrl:
        process.env.DATABASE_URL ||
        (esProduccion ? '' : 'postgresql://postgres:postgres@localhost:5432/cerohambre'),

    // "true" cuando el servidor de BD exige SSL (conexión externa a Render, por ejemplo)
    databaseSsl: process.env.DATABASE_SSL === 'true',

    // Llave con la que se firman los tokens de sesión
    jwtSecret:
        process.env.JWT_SECRET ||
        (esProduccion ? '' : 'clave-solo-para-desarrollo-local'),

    // Duración de la sesión (en horas)
    sesionHoras: Number(process.env.SESION_HORAS) || 8,

    // Zona horaria usada para validar fechas ("hoy")
    zonaHoraria: process.env.ZONA_HORARIA || 'America/Bogota',

    // Si es "false", no se insertan los datos de ejemplo al crear la BD
    cargarDatosEjemplo: process.env.CARGAR_DATOS_EJEMPLO !== 'false'
};

if (esProduccion && !config.databaseUrl) {
    throw new Error('Falta la variable de entorno DATABASE_URL.');
}

if (esProduccion && !config.jwtSecret) {
    throw new Error('Falta la variable de entorno JWT_SECRET.');
}

module.exports = config;
