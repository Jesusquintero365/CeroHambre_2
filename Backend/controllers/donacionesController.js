// ======================================================
// DONACIONES
// ======================================================

const db = require('../Config/database');
const config = require('../Config/env');
const v = require('../utils/validaciones');

const { ErrorApi } = v;

// Una donación "disponible" cuya fecha de vencimiento ya pasó
// se muestra como "vencido" (no se puede solicitar).
const SELECT_DONACION = `
    SELECT
        d.id,
        d.usuario_id,
        d.alimento,
        d.cantidad::float8 AS cantidad,
        d.unidad,
        to_char(d.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento,
        d.ubicacion,
        CASE
            WHEN d.estado = 'disponible'
             AND d.fecha_vencimiento < (NOW() AT TIME ZONE $1)::date
            THEN 'vencido'
            ELSE d.estado
        END AS estado,
        d.descripcion,
        d.fecha_publicacion,
        u.nombre AS donante
    FROM donaciones d
    INNER JOIN usuarios u ON d.usuario_id = u.id
`;

// Valida y limpia los datos de una donación
function leerDatosDonacion(cuerpo = {}) {
    return {
        alimento: v.texto(cuerpo.alimento, 'alimento', { min: 2, max: 120 }),
        cantidad: v.numeroPositivo(cuerpo.cantidad, 'cantidad'),
        unidad: v.opcion(cuerpo.unidad, 'unidad', v.UNIDADES),
        fecha_vencimiento: v.fecha(cuerpo.fecha_vencimiento, 'fecha_vencimiento', { noPasada: true }),
        ubicacion: v.texto(cuerpo.ubicacion, 'ubicacion', { min: 2, max: 150 }),
        descripcion: v.texto(cuerpo.descripcion, 'descripcion', { max: 500, obligatorio: false })
    };
}

// ------------------------------------------------------
// Crear una donación (solo donantes)
// ------------------------------------------------------
const crearDonacion = async (req, res) => {
    const d = leerDatosDonacion(req.body);

    const { rows } = await db.query(
        `INSERT INTO donaciones
            (usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id`,
        [req.usuario.id, d.alimento, d.cantidad, d.unidad, d.fecha_vencimiento, d.ubicacion, d.descripcion]
    );

    res.status(201).json({
        mensaje: 'Donación publicada correctamente',
        id: rows[0].id
    });
};

// ------------------------------------------------------
// Listar donaciones
// ------------------------------------------------------
const obtenerDonaciones = async (req, res) => {
    const { rows } = await db.query(
        `${SELECT_DONACION}
         ORDER BY d.fecha_publicacion DESC, d.id DESC`,
        [config.zonaHoraria]
    );

    res.json(rows);
};

// ------------------------------------------------------
// Obtener una donación por ID
// ------------------------------------------------------
const obtenerDonacionPorId = async (req, res) => {
    const id = v.idEntero(req.params.id);

    const { rows } = await db.query(
        `${SELECT_DONACION} WHERE d.id = $2`,
        [config.zonaHoraria, id]
    );

    if (rows.length === 0) {
        throw new ErrorApi(404, 'Donación no encontrada');
    }

    res.json(rows[0]);
};

// Carga una donación y comprueba que pertenezca al usuario autenticado
async function cargarDonacionPropia(req) {
    const id = v.idEntero(req.params.id);

    const { rows } = await db.query(
        'SELECT id, usuario_id, estado FROM donaciones WHERE id = $1',
        [id]
    );

    if (rows.length === 0) {
        throw new ErrorApi(404, 'Donación no encontrada');
    }

    if (Number(rows[0].usuario_id) !== Number(req.usuario.id)) {
        throw new ErrorApi(403, 'Solo el donante que la publicó puede modificar esta donación');
    }

    return rows[0];
}

// ------------------------------------------------------
// Actualizar una donación (solo mientras esté disponible)
// ------------------------------------------------------
const actualizarDonacion = async (req, res) => {
    const donacion = await cargarDonacionPropia(req);

    if (donacion.estado !== 'disponible') {
        throw new ErrorApi(409, 'Solo se pueden editar donaciones disponibles');
    }

    const d = leerDatosDonacion(req.body);

    await db.query(
        `UPDATE donaciones
         SET alimento = $1, cantidad = $2, unidad = $3, fecha_vencimiento = $4,
             ubicacion = $5, descripcion = $6
         WHERE id = $7`,
        [d.alimento, d.cantidad, d.unidad, d.fecha_vencimiento, d.ubicacion, d.descripcion, donacion.id]
    );

    res.json({ mensaje: 'Donación actualizada correctamente' });
};

// ------------------------------------------------------
// Eliminar una donación (solo si no tiene solicitudes)
// ------------------------------------------------------
const eliminarDonacion = async (req, res) => {
    const donacion = await cargarDonacionPropia(req);

    try {
        await db.query('DELETE FROM donaciones WHERE id = $1', [donacion.id]);
    } catch (error) {
        if (error.code === '23503') {
            throw new ErrorApi(409, 'No se puede eliminar: la donación ya tiene solicitudes asociadas');
        }

        throw error;
    }

    res.json({ mensaje: 'Donación eliminada correctamente' });
};

module.exports = {
    crearDonacion,
    obtenerDonaciones,
    obtenerDonacionPorId,
    actualizarDonacion,
    eliminarDonacion
};
