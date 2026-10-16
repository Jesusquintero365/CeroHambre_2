// ======================================================
// CONEXIÓN CON POSTGRESQL (pool de conexiones)
// ======================================================

const { Pool } = require('pg');
const config = require('./env');

const pool = new Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000
});

// Evita que un error de una conexión inactiva tumbe el servidor
pool.on('error', (error) => {
    console.error('❌ Error inesperado en el pool de PostgreSQL:', error.message);
});

// Ejecuta una consulta parametrizada
function query(texto, parametros) {
    return pool.query(texto, parametros);
}

// Ejecuta varias consultas como una sola transacción (todo o nada)
async function transaccion(trabajo) {
    const cliente = await pool.connect();

    try {
        await cliente.query('BEGIN');
        const resultado = await trabajo(cliente);
        await cliente.query('COMMIT');
        return resultado;
    } catch (error) {
        try {
            await cliente.query('ROLLBACK');
        } catch (errorRollback) {
            console.error('Error al revertir la transacción:', errorRollback.message);
        }
        throw error;
    } finally {
        cliente.release();
    }
}

module.exports = { pool, query, transaccion };
