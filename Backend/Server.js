const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// ======================================================
// FRONTEND
// ======================================================

app.use(
    express.static(
        path.join(__dirname, '..', 'Frontend')
    )
);

// ======================================================
// CONEXIÓN CON LA BASE DE DATOS
// ======================================================

require('./Config/database');

// ======================================================
// RUTAS API
// ======================================================

const usuariosRoutes = require('./Routes/Usuarios');
const donacionesRoutes = require('./Routes/Donaciones');
const solicitudesRoutes = require('./Routes/Solicitudes');
const entregasRoutes = require('./Routes/Entregas');
const reportesRoutes = require('./Routes/Reportes');

app.use('/api/usuarios', usuariosRoutes);
app.use('/api/donaciones', donacionesRoutes);
app.use('/api/solicitudes', solicitudesRoutes);
app.use('/api/entregas', entregasRoutes);
app.use('/api/reportes', reportesRoutes);

// ======================================================
// RUTA PRINCIPAL
// ======================================================

app.get('/', (req, res) => {

    res.sendFile(
        path.join(
            __dirname,
            '..',
            'Frontend',
            'index.html'
        )
    );

});

// ======================================================
// SERVIDOR
// ======================================================

const PORT = 3000;

app.listen(PORT, () => {

    console.log(
        `🚀 Servidor ejecutándose en http://localhost:${PORT}`
    );

});