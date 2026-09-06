const db = require('../Config/database');

// Obtener indicadores generales
const obtenerReportes = (req, res) => {
    const sql = `
        SELECT
            COALESCE((
                SELECT SUM(cantidad)
                FROM donaciones
                WHERE estado IN ('reservado', 'entregado')
            ), 0) AS alimentos_recuperados,

            COALESCE((
                SELECT COUNT(DISTINCT organizacion_id)
                FROM solicitudes
                WHERE estado IN ('aceptada', 'completada')
            ), 0) AS organizaciones_atendidas,

            COALESCE((
                SELECT COUNT(*)
                FROM entregas
                WHERE estado = 'entregada'
            ), 0) AS entregas_realizadas,

           COALESCE((
               SELECT COUNT(DISTINCT s.organizacion_id)
               FROM solicitudes s
               INNER JOIN entregas e
               ON e.solicitud_id = s.id
              WHERE e.estado = 'entregada'
            ), 0) AS organizaciones_beneficiadas
    `;

    db.query(sql, (error, resultados) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al generar los reportes'
            });
        }

        res.json({
            mensaje: 'Reportes generados correctamente',
            datos: resultados[0]
        });
    });
};

module.exports = {
    obtenerReportes
};