// ======================================================
// ENTREGAS (logística de una solicitud aceptada)
// ======================================================

const db = require('../Config/database');
const v = require('../utils/validaciones');

const { ErrorApi } = v;

const ESTADOS = ['pendiente', 'en_camino', 'entregada', 'cancelada'];

// Cambios de estado permitidos
const TRANSICIONES = {
    pendiente: ['en_camino', 'entregada', 'cancelada'],
    en_camino: ['entregada', 'cancelada'],
    entregada: [],
    cancelada: []
};

const SELECT_ENTREGA = `
    SELECT
        e.id,
        e.solicitud_id,
        to_char(e.fecha_entrega, 'YYYY-MM-DD') AS fecha_entrega,
        e.estado,
        e.observaciones,
        s.cantidad_solicitada::float8 AS cantidad_solicitada,
        s.organizacion_id,
        d.alimento,
        d.unidad,
        d.usuario_id AS donante_id,
        ud.nombre AS donante,
        uo.nombre AS organizacion
    FROM entregas e
    INNER JOIN solicitudes s ON e.solicitud_id = s.id
    INNER JOIN donaciones d ON s.donacion_id = d.id
    INNER JOIN usuarios ud ON d.usuario_id = ud.id
    INNER JOIN usuarios uo ON s.organizacion_id = uo.id
`;

function filtroPorRol(usuario) {
    return usuario.tipo_usuario === 'donante'
        ? 'WHERE d.usuario_id = $1'
        : 'WHERE s.organizacion_id = $1';
}

// ------------------------------------------------------
// Registrar una entrega (solo el donante de una solicitud aceptada)
// ------------------------------------------------------
const crearEntrega = async (req, res) => {
    const datos = req.body || {};

    const solicitudId = v.idEntero(datos.solicitud_id, 'solicitud_id');
    const fechaEntrega = v.fecha(datos.fecha_entrega, 'fecha_entrega', { obligatorio: false });
    const observaciones = v.texto(datos.observaciones, 'observaciones', { max: 500, obligatorio: false });

    const { rows } = await db.query(
        `SELECT s.id, s.estado, d.usuario_id AS donante_id
         FROM solicitudes s
         INNER JOIN donaciones d ON s.donacion_id = d.id
         WHERE s.id = $1`,
        [solicitudId]
    );

    if (rows.length === 0) {
        throw new ErrorApi(404, 'La solicitud no existe');
    }

    if (Number(rows[0].donante_id) !== Number(req.usuario.id)) {
        throw new ErrorApi(403, 'Solo el donante puede registrar la entrega de sus donaciones');
    }

    if (rows[0].estado !== 'aceptada') {
        throw new ErrorApi(409, 'Solo se puede registrar la entrega de solicitudes aceptadas');
    }

    try {
        const resultado = await db.query(
            `INSERT INTO entregas (solicitud_id, fecha_entrega, observaciones)
             VALUES ($1, $2, $3)
             RETURNING id`,
            [solicitudId, fechaEntrega, observaciones]
        );

        res.status(201).json({
            mensaje: 'Entrega registrada correctamente',
            id: resultado.rows[0].id
        });
    } catch (error) {
        if (error.code === '23505') {
            throw new ErrorApi(409, 'Ya existe una entrega registrada para esta solicitud');
        }

        throw error;
    }
};

// ------------------------------------------------------
// Listar entregas del usuario autenticado
// ------------------------------------------------------
const obtenerEntregas = async (req, res) => {
    const { rows } = await db.query(
        `${SELECT_ENTREGA}
         ${filtroPorRol(req.usuario)}
         ORDER BY e.id DESC`,
        [req.usuario.id]
    );

    res.json(rows);
};

// ------------------------------------------------------
// Obtener una entrega por ID (solo participantes)
// ------------------------------------------------------
const obtenerEntregaPorId = async (req, res) => {
    const id = v.idEntero(req.params.id);

    const { rows } = await db.query(`${SELECT_ENTREGA} WHERE e.id = $1`, [id]);

    if (rows.length === 0) {
        throw new ErrorApi(404, 'Entrega no encontrada');
    }

    const entrega = rows[0];
    const usuarioId = Number(req.usuario.id);

    if (Number(entrega.donante_id) !== usuarioId && Number(entrega.organizacion_id) !== usuarioId) {
        throw new ErrorApi(403, 'No tienes permiso para ver esta entrega');
    }

    res.json(entrega);
};

// ------------------------------------------------------
// Actualizar el estado de una entrega (solo el donante)
// ------------------------------------------------------
const actualizarEntrega = async (req, res) => {
    const id = v.idEntero(req.params.id);
    const datos = req.body || {};

    const estado = v.opcion(datos.estado, 'estado', ESTADOS);
    const fechaEntrega = v.fecha(datos.fecha_entrega, 'fecha_entrega', { obligatorio: false });
    const observaciones = v.texto(datos.observaciones, 'observaciones', { max: 500, obligatorio: false });

    await db.transaccion(async (cliente) => {
        const { rows } = await cliente.query(
            `SELECT e.id, e.estado, e.solicitud_id, s.donacion_id, d.usuario_id AS donante_id
             FROM entregas e
             INNER JOIN solicitudes s ON e.solicitud_id = s.id
             INNER JOIN donaciones d ON s.donacion_id = d.id
             WHERE e.id = $1
             FOR UPDATE OF e, s, d`,
            [id]
        );

        if (rows.length === 0) {
            throw new ErrorApi(404, 'Entrega no encontrada');
        }

        const entrega = rows[0];

        if (Number(entrega.donante_id) !== Number(req.usuario.id)) {
            throw new ErrorApi(403, 'Solo el donante puede actualizar esta entrega');
        }

        if (!TRANSICIONES[entrega.estado].includes(estado)) {
            throw new ErrorApi(
                409,
                `No se puede pasar una entrega de "${entrega.estado}" a "${estado}"`
            );
        }

        // Al marcarla como entregada, si no hay fecha se usa la de hoy
        const fechaPorDefecto = estado === 'entregada' ? v.hoy() : null;

        await cliente.query(
            `UPDATE entregas
             SET estado = $1,
                 fecha_entrega = COALESCE($2::date, fecha_entrega, $3::date),
                 observaciones = COALESCE($4, observaciones)
             WHERE id = $5`,
            [estado, fechaEntrega, fechaPorDefecto, observaciones, id]
        );

        // Efectos en la solicitud y la donación
        if (estado === 'entregada') {
            await cliente.query(`UPDATE solicitudes SET estado = 'completada' WHERE id = $1`, [entrega.solicitud_id]);
            await cliente.query(`UPDATE donaciones SET estado = 'entregado' WHERE id = $1`, [entrega.donacion_id]);
        }

        if (estado === 'cancelada') {
            // La donación vuelve a quedar disponible para otras organizaciones
            await cliente.query(`UPDATE solicitudes SET estado = 'rechazada' WHERE id = $1`, [entrega.solicitud_id]);
            await cliente.query(`UPDATE donaciones SET estado = 'disponible' WHERE id = $1`, [entrega.donacion_id]);
        }
    });

    res.json({ mensaje: 'Entrega actualizada correctamente' });
};

// ------------------------------------------------------
// Eliminar una entrega (solo el donante y si no fue entregada)
// ------------------------------------------------------
const eliminarEntrega = async (req, res) => {
    const id = v.idEntero(req.params.id);

    const { rows } = await db.query(
        `SELECT e.id, e.estado, d.usuario_id AS donante_id
         FROM entregas e
         INNER JOIN solicitudes s ON e.solicitud_id = s.id
         INNER JOIN donaciones d ON s.donacion_id = d.id
         WHERE e.id = $1`,
        [id]
    );

    if (rows.length === 0) {
        throw new ErrorApi(404, 'Entrega no encontrada');
    }

    if (Number(rows[0].donante_id) !== Number(req.usuario.id)) {
        throw new ErrorApi(403, 'Solo el donante puede eliminar esta entrega');
    }

    if (rows[0].estado === 'entregada') {
        throw new ErrorApi(409, 'Una entrega ya realizada hace parte del historial y no se puede eliminar');
    }

    await db.query('DELETE FROM entregas WHERE id = $1', [id]);

    res.json({ mensaje: 'Entrega eliminada correctamente' });
};

module.exports = {
    crearEntrega,
    obtenerEntregas,
    obtenerEntregaPorId,
    actualizarEntrega,
    eliminarEntrega
};
