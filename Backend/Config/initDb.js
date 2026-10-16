// ======================================================
// INICIALIZACIÓN DE LA BASE DE DATOS
// ======================================================
// Crea las tablas si no existen (database/schema.sql) y, cuando la
// base está vacía, carga los datos de ejemplo (database/seed.sql).
// Es idempotente: se puede ejecutar en cada arranque sin perder datos.

const fs = require('fs');
const path = require('path');
const config = require('./env');
const { pool } = require('./database');

const CARPETA_DB = path.join(__dirname, '..', '..', 'database');

function leerSql(nombre) {
    return fs.readFileSync(path.join(CARPETA_DB, nombre), 'utf8');
}

async function inicializarBD({ reiniciar = false } = {}) {
    if (reiniciar) {
        await pool.query(`
            DROP TABLE IF EXISTS entregas, solicitudes, donaciones, usuarios CASCADE;
        `);
        console.log('🗑️  Tablas eliminadas.');
    }

    await pool.query(leerSql('schema.sql'));

    const { rows } = await pool.query('SELECT COUNT(*)::int AS total FROM usuarios');

    if (rows[0].total === 0 && config.cargarDatosEjemplo) {
        await pool.query(leerSql('seed.sql'));
        console.log('🌱 Datos de ejemplo cargados.');
    }
}

module.exports = { inicializarBD };
