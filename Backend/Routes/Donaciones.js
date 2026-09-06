const express = require('express');

const router = express.Router();

const {
    crearDonacion,
    obtenerDonaciones,
    obtenerDonacionPorId,
    actualizarDonacion,
    eliminarDonacion
} = require('../controllers/donacionesController');

// Crear una donación
router.post('/', crearDonacion);

// Obtener todas las donaciones
router.get('/', obtenerDonaciones);

// Obtener una donación por ID
router.get('/:id', obtenerDonacionPorId);

// Actualizar una donación
router.put('/:id', actualizarDonacion);

// Eliminar una donación
router.delete('/:id', eliminarDonacion);

module.exports = router;