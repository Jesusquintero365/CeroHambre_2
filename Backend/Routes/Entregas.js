const express = require('express');

const router = express.Router();

const { autenticar, permitirRoles } = require('../middleware/auth');

const {
    crearEntrega,
    obtenerEntregas,
    obtenerEntregaPorId,
    actualizarEntrega,
    eliminarEntrega
} = require('../controllers/entregasController');

// Todas las rutas requieren sesión iniciada
router.use(autenticar);

// Listar mis entregas / ver una entrega
router.get('/', obtenerEntregas);
router.get('/:id', obtenerEntregaPorId);

// Registrar, actualizar y eliminar entregas (donantes)
router.post('/', permitirRoles('donante'), crearEntrega);
router.put('/:id', permitirRoles('donante'), actualizarEntrega);
router.delete('/:id', permitirRoles('donante'), eliminarEntrega);

module.exports = router;
