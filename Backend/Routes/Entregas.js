const express = require('express');

const router = express.Router();

const {
    crearEntrega,
    obtenerEntregas,
    obtenerEntregaPorId,
    actualizarEntrega,
    eliminarEntrega
} = require('../controllers/entregasController');

// Crear una entrega
router.post('/', crearEntrega);

// Obtener todas las entregas
router.get('/', obtenerEntregas);

// Obtener una entrega por ID
router.get('/:id', obtenerEntregaPorId);

// Actualizar una entrega
router.put('/:id', actualizarEntrega);

// Eliminar una entrega
router.delete('/:id', eliminarEntrega);

module.exports = router;