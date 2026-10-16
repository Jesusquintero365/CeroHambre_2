const express = require('express');

const router = express.Router();

const { autenticar } = require('../middleware/auth');

const {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil,
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario
} = require('../controllers/usuariosController');

// Registrar usuario (público)
router.post('/', registrarUsuario);

// Iniciar sesión (público)
router.post('/login', iniciarSesion);

// Perfil del usuario autenticado
router.get('/yo', autenticar, obtenerPerfil);

// Listar usuarios (datos públicos)
router.get('/', autenticar, obtenerUsuarios);

// Obtener, actualizar y eliminar la propia cuenta
router.get('/:id', autenticar, obtenerUsuarioPorId);
router.put('/:id', autenticar, actualizarUsuario);
router.delete('/:id', autenticar, eliminarUsuario);

module.exports = router;
