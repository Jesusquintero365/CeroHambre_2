const express = require('express');

const router = express.Router();

const { autenticar, permitirRoles } = require('../middleware/auth');

const {
    crearSolicitud,
    obtenerSolicitudes,
    obtenerSolicitudPorId,
    actualizarSolicitud,
    eliminarSolicitud
} = require('../controllers/solicitudesController');

// Todas las rutas requieren sesión iniciada
router.use(autenticar);

// Crear una solicitud (organizaciones)
router.post('/', permitirRoles('organizacion'), crearSolicitud);

// Listar mis solicitudes / ver una solicitud
router.get('/', obtenerSolicitudes);
router.get('/:id', obtenerSolicitudPorId);

// Aceptar o rechazar una solicitud (donantes)
router.put('/:id', permitirRoles('donante'), actualizarSolicitud);

// Eliminar una solicitud propia (organizaciones)
router.delete('/:id', permitirRoles('organizacion'), eliminarSolicitud);

module.exports = router;
