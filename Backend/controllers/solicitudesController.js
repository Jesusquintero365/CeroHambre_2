const db = require('../Config/database');

// Crear una solicitud
const crearSolicitud = (req, res) => {
    const {
        donacion_id,
        organizacion_id,
        cantidad_solicitada
    } = req.body;

    if (!donacion_id || !organizacion_id || !cantidad_solicitada) {
        return res.status(400).json({
            mensaje: 'Faltan datos obligatorios'
        });
    }

    const sql = `
        INSERT INTO solicitudes
        (donacion_id, organizacion_id, cantidad_solicitada)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [donacion_id, organizacion_id, cantidad_solicitada],
        (error, resultado) => {
            if (error) {
                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al crear la solicitud'
                });
            }

            res.status(201).json({
                mensaje: 'Solicitud creada correctamente',
                id: resultado.insertId
            });
        }
    );
};

// Obtener todas las solicitudes
const obtenerSolicitudes = (req, res) => {
    const sql = `
        SELECT
            s.id,
            s.donacion_id,
            s.organizacion_id,
            s.cantidad_solicitada,
            s.estado,
            s.fecha_solicitud,
            d.alimento,
            d.ubicacion,
            u.nombre AS organizacion
        FROM solicitudes s
        INNER JOIN donaciones d ON s.donacion_id = d.id
        INNER JOIN usuarios u ON s.organizacion_id = u.id
        ORDER BY s.fecha_solicitud DESC
    `;

    db.query(sql, (error, resultados) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al consultar las solicitudes'
            });
        }

        res.json(resultados);
    });
};

// Obtener una solicitud por ID
const obtenerSolicitudPorId = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            s.id,
            s.donacion_id,
            s.organizacion_id,
            s.cantidad_solicitada,
            s.estado,
            s.fecha_solicitud,
            d.alimento,
            d.cantidad AS cantidad_disponible,
            d.unidad,
            d.ubicacion,
            u.nombre AS organizacion
        FROM solicitudes s
        INNER JOIN donaciones d ON s.donacion_id = d.id
        INNER JOIN usuarios u ON s.organizacion_id = u.id
        WHERE s.id = ?
    `;

    db.query(sql, [id], (error, resultados) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al consultar la solicitud'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensaje: 'Solicitud no encontrada'
            });
        }

        res.json(resultados[0]);
    });
};

// Actualizar el estado de una solicitud

const actualizarSolicitud = (req, res) => {

    const { id } = req.params;

    const { estado, usuario_id } = req.body;

    const estadosPermitidos = [
        'pendiente',
        'aceptada',
        'rechazada',
        'completada'
    ];

    if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({
            mensaje: 'Estado de solicitud no válido'
        });
    }

    if (!usuario_id) {
        return res.status(400).json({
            mensaje: 'Se necesita el usuario que realiza la acción'
        });
    }

    // Verificar quién publicó la donación
    const sqlVerificar = `
        SELECT
            s.id,
            s.estado,
            d.usuario_id AS donante_id
        FROM solicitudes s
        INNER JOIN donaciones d
            ON s.donacion_id = d.id
        WHERE s.id = ?
    `;

    db.query(sqlVerificar, [id], (error, resultados) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al verificar la solicitud'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensaje: 'Solicitud no encontrada'
            });
        }

        const solicitud = resultados[0];

        // Solo el donante dueño de la donación
        // puede aceptar o rechazar
        if (Number(solicitud.donante_id) !== Number(usuario_id)) {

            return res.status(403).json({
                mensaje: 'No tienes permiso para gestionar esta solicitud'
            });
        }

        const sqlActualizar = `
            UPDATE solicitudes
            SET estado = ?
            WHERE id = ?
        `;

       db.query(
    sqlActualizar,
    [estado, id],
    (error, resultado) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al actualizar la solicitud'
            });
        }

                // Si la solicitud fue aceptada,
        // la donación pasa a estado reservado
        if (estado === 'aceptada') {

            const sqlReservar = `
                UPDATE donaciones
                SET estado = 'reservado'
                WHERE id = (
                    SELECT donacion_id
                    FROM solicitudes
                    WHERE id = ?
                )
            `;

            db.query(
                sqlReservar,
                [id],
                (error) => {

                    if (error) {
                        console.error(error);

                        return res.status(500).json({
                            mensaje: 'La solicitud fue aceptada, pero no se pudo reservar la donación'
                        });
                    }

                    return res.json({
                        mensaje: 'Solicitud aceptada y donación reservada correctamente'
                    });
                }
            );

        } else {

            res.json({
                mensaje: 'Solicitud actualizada correctamente'
            });
        }
     }
  );
});
};

// Eliminar una solicitud
const eliminarSolicitud = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM solicitudes WHERE id = ?';

    db.query(sql, [id], (error, resultado) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al eliminar la solicitud'
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Solicitud no encontrada'
            });
        }

        res.json({
            mensaje: 'Solicitud eliminada correctamente'
        });
    });
};

module.exports = {
    crearSolicitud,
    obtenerSolicitudes,
    obtenerSolicitudPorId,
    actualizarSolicitud,
    eliminarSolicitud
};