const db = require('../Config/database');

// Crear una entrega
const crearEntrega = (req, res) => {
    const { solicitud_id, fecha_entrega, observaciones } = req.body;

    if (!solicitud_id) {
        return res.status(400).json({
            mensaje: 'La solicitud es obligatoria'
        });
    }

    const sql = `
        INSERT INTO entregas
        (solicitud_id, fecha_entrega, observaciones)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [
            solicitud_id,
            fecha_entrega || null,
            observaciones || null
        ],
        (error, resultado) => {
            if (error) {
                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al crear la entrega'
                });
            }

            res.status(201).json({
                mensaje: 'Entrega registrada correctamente',
                id: resultado.insertId
            });
        }
    );
};

// Obtener todas las entregas
const obtenerEntregas = (req, res) => {
    const sql = `
        SELECT
            e.id,
            e.solicitud_id,
            e.fecha_entrega,
            e.estado,
            e.observaciones,
            s.cantidad_solicitada,
            d.alimento,
            u.nombre AS organizacion
        FROM entregas e
        INNER JOIN solicitudes s ON e.solicitud_id = s.id
        INNER JOIN donaciones d ON s.donacion_id = d.id
        INNER JOIN usuarios u ON s.organizacion_id = u.id
        ORDER BY e.id DESC
    `;

    db.query(sql, (error, resultados) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al consultar las entregas'
            });
        }

        res.json(resultados);
    });
};

// Obtener una entrega por ID
const obtenerEntregaPorId = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT
            e.id,
            e.solicitud_id,
            e.fecha_entrega,
            e.estado,
            e.observaciones,
            s.cantidad_solicitada,
            d.alimento,
            d.unidad,
            u.nombre AS organizacion
        FROM entregas e
        INNER JOIN solicitudes s ON e.solicitud_id = s.id
        INNER JOIN donaciones d ON s.donacion_id = d.id
        INNER JOIN usuarios u ON s.organizacion_id = u.id
        WHERE e.id = ?
    `;

    db.query(sql, [id], (error, resultados) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al consultar la entrega'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensaje: 'Entrega no encontrada'
            });
        }

        res.json(resultados[0]);
    });
};

// Actualizar estado de una entrega
const actualizarEntrega = (req, res) => {
    const { id } = req.params;
    const { estado, fecha_entrega, observaciones } = req.body;

    const estadosPermitidos = [
        'pendiente',
        'en_camino',
        'entregada',
        'cancelada'
    ];

    if (!estadosPermitidos.includes(estado)) {
        return res.status(400).json({
            mensaje: 'Estado de entrega no válido'
        });
    }

    const sql = `
        UPDATE entregas
        SET estado = ?, fecha_entrega = ?, observaciones = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [
            estado,
            fecha_entrega || null,
            observaciones || null,
            id
        ],
        (error, resultado) => {
            if (error) {
                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al actualizar la entrega'
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Entrega no encontrada'
                });
            }

            res.json({
                mensaje: 'Entrega actualizada correctamente'
            });
        }
    );
};

// Eliminar una entrega
const eliminarEntrega = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM entregas WHERE id = ?';

    db.query(sql, [id], (error, resultado) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al eliminar la entrega'
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Entrega no encontrada'
            });
        }

        res.json({
            mensaje: 'Entrega eliminada correctamente'
        });
    });
};

module.exports = {
    crearEntrega,
    obtenerEntregas,
    obtenerEntregaPorId,
    actualizarEntrega,
    eliminarEntrega
};