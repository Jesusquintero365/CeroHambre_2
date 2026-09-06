const db = require('../Config/database');


// ======================================================
// CREAR UNA DONACIÓN
// ======================================================

const crearDonacion = (req, res) => {

    const {
        usuario_id,
        alimento,
        cantidad,
        unidad,
        fecha_vencimiento,
        ubicacion,
        descripcion
    } = req.body;


    // ------------------------------------------
    // Validar datos obligatorios
    // ------------------------------------------

    if (
        !usuario_id ||
        !alimento ||
        !cantidad ||
        !unidad ||
        !fecha_vencimiento ||
        !ubicacion
    ) {

        return res.status(400).json({
            mensaje: 'Faltan datos obligatorios'
        });
    }


    // ------------------------------------------
    // Insertar donación
    // ------------------------------------------

    const sql = `
        INSERT INTO donaciones
        (
            usuario_id,
            alimento,
            cantidad,
            unidad,
            fecha_vencimiento,
            ubicacion,
            descripcion
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)
    `;


    db.query(
        sql,
        [
            usuario_id,
            alimento,
            cantidad,
            unidad,
            fecha_vencimiento,
            ubicacion,
            descripcion || null
        ],

        (error, resultado) => {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al crear la donación'
                });
            }


            res.status(201).json({

                mensaje:
                    'Donación publicada correctamente',

                id:
                    resultado.insertId

            });

        }
    );
};



// ======================================================
// OBTENER TODAS LAS DONACIONES
// ======================================================

const obtenerDonaciones = (req, res) => {

    const sql = `
        SELECT

            d.id,

            d.usuario_id,

            d.alimento,

            d.cantidad,

            d.unidad,

            d.fecha_vencimiento,

            d.ubicacion,

            d.estado,

            d.descripcion,

            d.fecha_publicacion,

            u.nombre AS donante

        FROM donaciones d

        INNER JOIN usuarios u
            ON d.usuario_id = u.id

        ORDER BY
            d.fecha_publicacion DESC
    `;


    db.query(
        sql,

        (error, resultados) => {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    mensaje:
                        'Error al consultar las donaciones'
                });
            }


            res.json(resultados);
        }
    );
};



// ======================================================
// OBTENER UNA DONACIÓN POR ID
// ======================================================

const obtenerDonacionPorId = (req, res) => {

    const {
        id
    } = req.params;


    const sql = `
        SELECT

            d.id,

            d.usuario_id,

            d.alimento,

            d.cantidad,

            d.unidad,

            d.fecha_vencimiento,

            d.ubicacion,

            d.estado,

            d.descripcion,

            d.fecha_publicacion,

            u.nombre AS donante

        FROM donaciones d

        INNER JOIN usuarios u
            ON d.usuario_id = u.id

        WHERE d.id = ?
    `;


    db.query(
        sql,
        [id],

        (error, resultados) => {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    mensaje:
                        'Error al consultar la donación'
                });
            }


            if (
                resultados.length === 0
            ) {

                return res.status(404).json({
                    mensaje:
                        'Donación no encontrada'
                });
            }


            res.json(
                resultados[0]
            );
        }
    );
};



// ======================================================
// ACTUALIZAR UNA DONACIÓN
// ======================================================

const actualizarDonacion = (req, res) => {

    const {
        id
    } = req.params;


    const {
        alimento,
        cantidad,
        unidad,
        fecha_vencimiento,
        ubicacion,
        estado,
        descripcion
    } = req.body;


    const sql = `
        UPDATE donaciones

        SET

            alimento = ?,

            cantidad = ?,

            unidad = ?,

            fecha_vencimiento = ?,

            ubicacion = ?,

            estado = ?,

            descripcion = ?

        WHERE id = ?
    `;


    db.query(
        sql,

        [
            alimento,
            cantidad,
            unidad,
            fecha_vencimiento,
            ubicacion,
            estado,
            descripcion || null,
            id
        ],

        (error, resultado) => {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    mensaje:
                        'Error al actualizar la donación'
                });
            }


            if (
                resultado.affectedRows === 0
            ) {

                return res.status(404).json({
                    mensaje:
                        'Donación no encontrada'
                });
            }


            res.json({
                mensaje:
                    'Donación actualizada correctamente'
            });
        }
    );
};



// ======================================================
// ELIMINAR UNA DONACIÓN
// ======================================================

const eliminarDonacion = (req, res) => {

    const {
        id
    } = req.params;


    const sql =
        'DELETE FROM donaciones WHERE id = ?';


    db.query(
        sql,
        [id],

        (error, resultado) => {

            if (error) {

                console.error(error);

                return res.status(500).json({
                    mensaje:
                        'Error al eliminar la donación'
                });
            }


            if (
                resultado.affectedRows === 0
            ) {

                return res.status(404).json({
                    mensaje:
                        'Donación no encontrada'
                });
            }


            res.json({
                mensaje:
                    'Donación eliminada correctamente'
            });
        }
    );
};



// ======================================================
// EXPORTAR FUNCIONES
// ======================================================

module.exports = {

    crearDonacion,

    obtenerDonaciones,

    obtenerDonacionPorId,

    actualizarDonacion,

    eliminarDonacion

};