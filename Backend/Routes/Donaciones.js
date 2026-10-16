const express = require('express');

const router = express.Router();

const { autenticar, permitirRoles } = require('../middleware/auth');

const {
    crearDonacion,
    obtenerDonaciones,
    obtenerDonacionPorId,
    actualizarDonacion,
    eliminarDonacion
} = require('../controllers/donacionesController');

// Consultar donaciones (público)
router.get('/', obtenerDonaciones);
router.get('/:id', obtenerDonacionPorId);

// Publicar, editar y eliminar donaciones (solo donantes)
router.post('/', autenticar, permitirRoles('donante'), crearDonacion);
router.put('/:id', autenticar, permitirRoles('donante'), actualizarDonacion);
router.delete('/:id', autenticar, permitirRoles('donante'), eliminarDonacion);

module.exports = router;
