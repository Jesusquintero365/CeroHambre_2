const express = require('express');

const router = express.Router();

const {
    obtenerReportes
} = require('../controllers/reportesController');

// Obtener reportes e indicadores
router.get('/', obtenerReportes);

module.exports = router;