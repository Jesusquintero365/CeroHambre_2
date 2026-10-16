// ======================================================
// SOLICITUDES (una organización pide una donación)
// ======================================================

const db = require('../Config/database');
const v = require('../utils/validaciones');

const { ErrorApi } = v;

const SELECT_SOLICITUD = `
    SELECT
        s.id,
        s.donacion_id,
        s.organizacion_id,
        s.cantidad_solicitada::float8 AS cantidad_solicitada,
        s.estado,
        s.fecha_solicitud,
        d.alimento,
        d.cantidad::float8 AS cantidad_disponible,
        d.unidad,
        d.ubicacion,
        d.usuario_id AS donante_id,
        ud.nombre AS donante,
        uo.nombre AS organizacion,
        EXISTS (SELECT 1 FROM entregas e WHERE e.solicitud_id = s.id) AS tiene_entrega
    FROM solicitudes s
    INNER JOIN donaciones d ON s.donacion_id = d.id
    INNER JOIN usuarios ud ON d.usuario_id = ud.id
    INNER JOIN usuarios uo ON s.organizacion_id = uo.id
`;

// Un donante solo ve las solicitudes de sus donaciones;
// una organización solo ve las suyas.
function filtroPorRol(usuario) {
    return usuario.tipo_usuario === 'donante'
        ? 'WHERE d.usuario_id = $1'
        : 'WHERE s.organizacion_id = $1';
}

function esParticipante(solicitud, usuario) {
    return (
        Number(solicitud.donante_id) === Number(usuario.id) ||
        Number(solicitud.organizacion_id) === Number(usuario.id)
    );
}

// ------------------------------------------------------
// Crear una solicitud (solo organizaciones)
// ------------------------------------------------------
const crearSolicitud = async (req, res) => {
    const datos = req.body || {};

    const donacionId = v.idEntero(datos.donacion_id, 'donacion_id');
    const cantidad = v.numeroPositivo(datos.cantidad_solicitada, 'cantidad_solicitada');

    const id = await db.transaccion(async (cliente) => {
        // Se bloquea la donación para evitar solicitudes simultáneas inconsistentes
        const { rows } = await cliente.query(
            `SELECT id, cantidad::float8 AS cantidad, unidad, estado,
                    to_char(fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento
             FROM donaciones
             WHERE id = $1
             FOR UPDATE`,
            [donacionId]
        );

        if (rows.length === 0) {
            throw new ErrorApi(404, 'La donación no existe');
        }

        const donacion = rows[0];

        if (donacion.estado !== 'disponible') {
            throw new ErrorApi(409, 'La donación ya no está disponible');
        }

        if (donacion.fecha_vencimiento < v.hoy()) {
            throw new ErrorApi(409, 'La donación está vencida y no puede solicitarse');
        }

        if (cantidad > donacion.cantidad) {
            throw new ErrorApi(
                400,
                `No puedes solicitar más de lo disponible (${donacion.cantidad} ${donacion.unidad})`
            );
        }

        try {
            const resultado = await cliente.query(
                `INSERT INTO solicitudes (donacion_id, organizacion_id, cantidad_solicitada)
                 VALUES ($1, $2, $3)
                 RETURNING id`,
                [donacionId, req.usuario.id, cantidad]
            );

            return resultado.rows[0].id;
        } catch (error) {
            if (error.code === '23505') {
                throw new ErrorApi(409, 'Ya tienes una solicitud activa para esta donación');
            }

            throw error;
        }
    });

    res.status(201).json({
        mensaje: 'Solicitud creada correctamente',
        id
    });
};

// ------------------------------------------------------
// Listar solicitudes del usuario autenticado
// ------------------------------------------------------
const obtenerSolicitudes = async (req, res) => {
    const { rows } = await db.query(
        `${SELECT_SOLICITUD}
         ${filtroPorRol(req.usuario)}
         ORDER BY s.fecha_solicitud DESC, s.id DESC`,
        [req.usuario.id]
    );

    res.json(rows);
};

// ------------------------------------------------------
// Obtener una solicitud por ID (solo participantes)
// ------------------------------------------------------
const obtenerSolicitudPorId = async (req, res) => {
    const id = v.idEntero(req.params.id);

    const { rows } = await db.query(`${SELECT_SOLICITUD} WHERE s.id = $1`, [id]);

    if (rows.length === 0) {
        throw new ErrorApi(404, 'Solicitud no encontrada');
    }

    if (!esParticipante(rows[0], req.usuario)) {
        throw new ErrorApi(403, 'No tienes permiso para ver esta solicitud');
    }

    res.json(rows[0]);
};

// ------------------------------------------------------
// Aceptar o rechazar una solicitud (solo el donante dueño)
// ------------------------------------------------------
const actualizarSolicitud = async (req, res) => {
    const id = v.idEntero(req.params.id);
    const estado = v.opcion((req.body || {}).estado, 'estado', ['aceptada', 'rechazada']);

    const mensaje = await db.transaccion(async (cliente) => {
        const { rows } = await cliente.query(
            `SELECT s.id, s.estado, s.donacion_id,
                    d.usuario_id AS donante_id,
                    d.estado AS estado_donacion,
                    to_char(d.fecha_vencimiento, 'YYYY-MM-DD') AS fecha_vencimiento
             FROM solicitudes s
             INNER JOIN donaciones d ON s.donacion_id = d.id
             WHERE s.id = $1
             FOR UPDATE OF s, d`,
            [id]
        );

        if (rows.length === 0) {
            throw new ErrorApi(404, 'Solicitud no encontrada');
        }

        const solicitud = rows[0];

        // Solo el donante dueño de la donación puede gestionar la solicitud
        if (Number(solicitud.donante_id) !== Number(req.usuario.id)) {
            throw new ErrorApi(403, 'No tienes permiso para gestionar esta solicitud');
        }

        if (solicitud.estado !== 'pendiente') {
            throw new ErrorApi(409, `La solicitud ya fue gestionada (estado: ${solicitud.estado})`);
        }

        if (estado === 'rechazada') {
            await cliente.query(`UPDATE solicitudes SET estado = 'rechazada' WHERE id = $1`, [id]);
            return 'Solicitud rechazada correctamente';
        }

        // --- Aceptar ---
        if (solicitud.estado_donacion !== 'disponible') {
            throw new ErrorApi(409, 'La donación ya no está disponible');
        }

        if (solicitud.fecha_vencimiento < v.hoy()) {
            throw new ErrorApi(409, 'La donación está vencida y no puede entregarse');
        }

        await cliente.query(`UPDATE solicitudes SET estado = 'aceptada' WHERE id = $1`, [id]);

        await cliente.query(`UPDATE donaciones SET estado = 'reservado' WHERE id = $1`, [solicitud.donacion_id]);

        // Las demás solicitudes pendientes de la misma donación se rechazan
        await cliente.query(
            `UPDATE solicitudes
             SET estado = 'rechazada'
             WHERE donacion_id = $1 AND id <> $2 AND estado = 'pendiente'`,
            [solicitud.donacion_id, id]
        );

        return 'Solicitud aceptada y donación reservada correctamente';
    });

    res.json({ mensaje });
};

// ------------------------------------------------------
// Eliminar una solicitud (la organización, mientras esté pendiente o rechazada)
// ------------------------------------------------------
const eliminarSolicitud = async (req, res) => {
    const id = v.idEntero(req.params.id);

    const { rows } = await db.query(
        'SELECT id, organizacion_id, estado FROM solicitudes WHERE id = $1',
        [id]
    );

    if (rows.length === 0) {
        throw new ErrorApi(404, 'Solicitud no encontrada');
    }

    if (Number(rows[0].organizacion_id) !== Number(req.usuario.id)) {
        throw new ErrorApi(403, 'Solo la organización que hizo la solicitud puede eliminarla');
    }

    if (!['pendiente', 'rechazada'].includes(rows[0].estado)) {
        throw new ErrorApi(409, 'No se puede eliminar una solicitud aceptada o completada');
    }

    await db.query('DELETE FROM solicitudes WHERE id = $1', [id]);

    res.json({ mensaje: 'Solicitud eliminada correctamente' });
};

module.exports = {
    crearSolicitud,
    obtenerSolicitudes,
    obtenerSolicitudPorId,
    actualizarSolicitud,
    eliminarSolicitud
};
