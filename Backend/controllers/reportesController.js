// ======================================================
// REPORTES E INDICADORES DE IMPACTO
// ======================================================
// Los alimentos recuperados se calculan con las solicitudes aceptadas o
// completadas (lo que realmente se reservó/entregó), convirtiendo a kg
// solo las unidades de masa. Litros, unidades y porciones se muestran
// por separado porque no se pueden sumar con kilogramos.

const db = require('../Config/database');
const config = require('../Config/env');

const obtenerReportes = async (req, res) => {
    const indicadores = await db.query(`
        SELECT
            COALESCE((
                SELECT ROUND(SUM(
                    CASE d.unidad
                        WHEN 'kg' THEN s.cantidad_solicitada
                        WHEN 'gramos' THEN s.cantidad_solicitada / 1000
                        ELSE 0
                    END
                ), 2)
                FROM solicitudes s
                INNER JOIN donaciones d ON s.donacion_id = d.id
                WHERE s.estado IN ('aceptada', 'completada')
            ), 0)::float8 AS alimentos_recuperados,

            (
                SELECT COUNT(DISTINCT organizacion_id)
                FROM solicitudes
                WHERE estado IN ('aceptada', 'completada')
            )::int AS organizaciones_atendidas,

            (
                SELECT COUNT(*)
                FROM entregas
                WHERE estado = 'entregada'
            )::int AS entregas_realizadas,

            (
                SELECT COUNT(DISTINCT s.organizacion_id)
                FROM solicitudes s
                INNER JOIN entregas e ON e.solicitud_id = s.id
                WHERE e.estado = 'entregada'
            )::int AS organizaciones_beneficiadas,

            (SELECT COUNT(*) FROM donaciones)::int AS donaciones_publicadas,

            (SELECT COUNT(DISTINCT usuario_id) FROM donaciones)::int AS donantes_activos
    `);

    const porUnidad = await db.query(`
        SELECT d.unidad, ROUND(SUM(s.cantidad_solicitada), 2)::float8 AS total
        FROM solicitudes s
        INNER JOIN donaciones d ON s.donacion_id = d.id
        WHERE s.estado IN ('aceptada', 'completada')
        GROUP BY d.unidad
        ORDER BY d.unidad
    `);

    const porEstado = await db.query(
        `
        SELECT estado, COUNT(*)::int AS total
        FROM (
            SELECT CASE
                WHEN d.estado = 'disponible'
                 AND d.fecha_vencimiento < (NOW() AT TIME ZONE $1)::date
                THEN 'vencido'
                ELSE d.estado
            END AS estado
            FROM donaciones d
        ) t
        GROUP BY estado
        ORDER BY estado
        `,
        [config.zonaHoraria]
    );

    res.json({
        mensaje: 'Reportes generados correctamente',
        datos: indicadores.rows[0],
        por_unidad: porUnidad.rows,
        donaciones_por_estado: porEstado.rows
    });
};

module.exports = { obtenerReportes };
