// ======================================================
// MANEJO CENTRAL DE ERRORES
// ======================================================

const { ErrorApi } = require('../utils/validaciones');

// Rutas /api que no existen
function rutaNoEncontrada(req, res) {
    res.status(404).json({ mensaje: 'Ruta no encontrada' });
}

// Cualquier error que llegue aquí se convierte en una respuesta JSON
// eslint-disable-next-line no-unused-vars
function manejarErrores(error, req, res, next) {
    if (error instanceof ErrorApi) {
        return res.status(error.estado).json({ mensaje: error.message });
    }

    // JSON mal formado en el cuerpo de la petición
    if (error.type === 'entity.parse.failed' || error instanceof SyntaxError) {
        return res.status(400).json({ mensaje: 'El cuerpo de la petición no es un JSON válido' });
    }

    if (error.type === 'entity.too.large') {
        return res.status(413).json({ mensaje: 'La petición es demasiado grande' });
    }

    // Violaciones de restricciones de PostgreSQL
    if (error.code === '23505') {
        return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos' });
    }

    if (error.code === '23503') {
        return res.status(409).json({ mensaje: 'El registro tiene información relacionada y no se puede modificar o eliminar' });
    }

    if (error.code === '23514' || error.code === '22P02' || error.code === '22003') {
        return res.status(400).json({ mensaje: 'Alguno de los datos enviados no es válido' });
    }

    console.error('❌ Error no controlado:', error);

    res.status(500).json({ mensaje: 'Error interno del servidor' });
}

module.exports = { rutaNoEncontrada, manejarErrores };
