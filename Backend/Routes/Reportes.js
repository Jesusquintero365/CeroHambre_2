const express = require('express');

const router = express.Router();

const { obtenerReportes } = require('../controllers/reportesController');

// Indicadores de impacto (público)
router.get('/', obtenerReportes);

module.exports = router;
