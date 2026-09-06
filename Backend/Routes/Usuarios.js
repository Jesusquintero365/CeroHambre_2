const express = require('express');

const router = express.Router();

const {
    registrarUsuario,
    iniciarSesion,
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario
} = require('../controllers/usuariosController');

// Registrar usuario
router.post('/', registrarUsuario);

// Iniciar sesión
router.post('/login', iniciarSesion);

// Obtener todos los usuarios
router.get('/', obtenerUsuarios);

// Obtener usuario por ID
router.get('/:id', obtenerUsuarioPorId);

// Actualizar usuario
router.put('/:id', actualizarUsuario);

// Eliminar usuario
router.delete('/:id', eliminarUsuario);

module.exports = router;