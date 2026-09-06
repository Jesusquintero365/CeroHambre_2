const express = require('express');

const router = express.Router();

const {
    crearSolicitud,
    obtenerSolicitudes,
    obtenerSolicitudPorId,
    actualizarSolicitud,
    eliminarSolicitud
} = require('../controllers/solicitudesController');

// Crear una solicitud
router.post('/', crearSolicitud);

// Obtener todas las solicitudes
router.get('/', obtenerSolicitudes);

// Obtener una solicitud por ID
router.get('/:id', obtenerSolicitudPorId);

// Actualizar el estado de una solicitud
router.put('/:id', actualizarSolicitud);

// Eliminar una solicitud
router.delete('/:id', eliminarSolicitud);

module.exports = router;
