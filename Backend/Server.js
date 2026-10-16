// ======================================================
// CeroHambre - Servidor (Express + PostgreSQL)
// Sirve la API REST (/api) y el frontend estático.
// ======================================================

const express = require('express');
const cors = require('cors');
const path = require('path');

const config = require('./Config/env');
const db = require('./Config/database');
const { inicializarBD } = require('./Config/initDb');
const { rutaNoEncontrada, manejarErrores } = require('./middleware/errores');

const app = express();

app.use(cors());
app.use(express.json({ limit: '100kb' }));

// ======================================================
// FRONTEND
// ======================================================

app.use(express.static(path.join(__dirname, '..', 'Frontend')));

// ======================================================
// RUTAS API
// ======================================================

// Comprobación de salud (Render la usa para saber si el servicio está vivo)
app.get('/api/salud', async (req, res) => {
    try {
        await db.query('SELECT 1');
        res.json({ estado: 'ok', baseDeDatos: 'conectada' });
    } catch (error) {
        res.status(503).json({ estado: 'error', baseDeDatos: 'sin conexión' });
    }
});

app.use('/api/usuarios', require('./Routes/Usuarios'));
app.use('/api/donaciones', require('./Routes/Donaciones'));
app.use('/api/solicitudes', require('./Routes/Solicitudes'));
app.use('/api/entregas', require('./Routes/Entregas'));
app.use('/api/reportes', require('./Routes/Reportes'));

app.use('/api', rutaNoEncontrada);

// ======================================================
// RUTA PRINCIPAL
// ======================================================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'Frontend', 'index.html'));
});

app.use(manejarErrores);

// ======================================================
// ARRANQUE
// ======================================================

async function iniciar() {
    try {
        await inicializarBD();
        console.log('✅ Conexión exitosa con la base de datos PostgreSQL');
    } catch (error) {
        console.error('❌ Error al conectar o preparar la base de datos:', error.message);
        process.exit(1);
    }

    app.listen(config.puerto, '0.0.0.0', () => {
        console.log(`🚀 Servidor ejecutándose en el puerto ${config.puerto}`);
    });
}

if (require.main === module) {
    iniciar();
}

module.exports = { app, iniciar };
