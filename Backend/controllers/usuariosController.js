// ======================================================
// USUARIOS: registro, inicio de sesión y perfil
// ======================================================

const db = require('../Config/database');
const config = require('../Config/env');
const { hashPassword, verificarPassword } = require('../utils/password');
const { crearToken } = require('../utils/token');
const v = require('../utils/validaciones');

const { ErrorApi } = v;

// Hash de referencia para que el tiempo de respuesta no revele si el correo existe
const HASH_FALSO = 'scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA==$' + Buffer.alloc(64).toString('base64');

// ------------------------------------------------------
// Registrar usuario
// ------------------------------------------------------
const registrarUsuario = async (req, res) => {
    const datos = req.body || {};

    const nombre = v.texto(datos.nombre, 'nombre', { min: 2, max: 100 });
    const correo = v.correo(datos.correo);
    const password = v.password(datos.password);
    const tipo_usuario = v.opcion(datos.tipo_usuario, 'tipo_usuario', v.TIPOS_USUARIO);
    const ubicacion = v.texto(datos.ubicacion, 'ubicacion', { min: 2, max: 150 });

    const passwordHash = await hashPassword(password);

    try {
        const { rows } = await db.query(
            `INSERT INTO usuarios (nombre, correo, password_hash, tipo_usuario, ubicacion)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id`,
            [nombre, correo, passwordHash, tipo_usuario, ubicacion]
        );

        res.status(201).json({
            mensaje: 'Usuario registrado correctamente',
            id: rows[0].id
        });
    } catch (error) {
        if (error.code === '23505') {
            throw new ErrorApi(409, 'El correo ya está registrado');
        }

        throw error;
    }
};

// ------------------------------------------------------
// Iniciar sesión
// ------------------------------------------------------
const iniciarSesion = async (req, res) => {
    const datos = req.body || {};

    if (!datos.correo || !datos.password) {
        throw new ErrorApi(400, 'El correo y la contraseña son obligatorios');
    }

    const correo = String(datos.correo).trim().toLowerCase();

    const { rows } = await db.query(
        `SELECT id, nombre, correo, password_hash, tipo_usuario, ubicacion
         FROM usuarios
         WHERE correo = $1`,
        [correo]
    );

    const usuario = rows[0];

    const valida = await verificarPassword(
        String(datos.password),
        usuario ? usuario.password_hash : HASH_FALSO
    );

    if (!usuario || !valida) {
        throw new ErrorApi(401, 'Correo o contraseña incorrectos');
    }

    delete usuario.password_hash;

    const token = crearToken(
        { id: usuario.id, nombre: usuario.nombre, tipo_usuario: usuario.tipo_usuario },
        config.jwtSecret,
        config.sesionHoras
    );

    res.json({
        mensaje: 'Inicio de sesión exitoso',
        usuario,
        token
    });
};

// ------------------------------------------------------
// Perfil del usuario autenticado
// ------------------------------------------------------
const obtenerPerfil = async (req, res) => {
    const { rows } = await db.query(
        `SELECT id, nombre, correo, tipo_usuario, ubicacion, fecha_registro
         FROM usuarios
         WHERE id = $1`,
        [req.usuario.id]
    );

    if (rows.length === 0) {
        throw new ErrorApi(404, 'Usuario no encontrado');
    }

    res.json(rows[0]);
};

// ------------------------------------------------------
// Listar usuarios (solo datos públicos, sin correo)
// ------------------------------------------------------
const obtenerUsuarios = async (req, res) => {
    const { rows } = await db.query(
        `SELECT id, nombre, tipo_usuario, ubicacion, fecha_registro
         FROM usuarios
         ORDER BY nombre`
    );

    res.json(rows);
};

// El usuario solo puede ver, editar o eliminar su propia cuenta
function exigirCuentaPropia(req) {
    const id = v.idEntero(req.params.id);

    if (id !== Number(req.usuario.id)) {
        throw new ErrorApi(403, 'Solo puedes gestionar tu propia cuenta');
    }

    return id;
}

// ------------------------------------------------------
// Obtener un usuario por ID (solo la propia cuenta)
// ------------------------------------------------------
const obtenerUsuarioPorId = async (req, res) => {
    const id = exigirCuentaPropia(req);

    const { rows } = await db.query(
        `SELECT id, nombre, correo, tipo_usuario, ubicacion, fecha_registro
         FROM usuarios
         WHERE id = $1`,
        [id]
    );

    if (rows.length === 0) {
        throw new ErrorApi(404, 'Usuario no encontrado');
    }

    res.json(rows[0]);
};

// ------------------------------------------------------
// Actualizar usuario (nombre, correo y ubicación)
// ------------------------------------------------------
const actualizarUsuario = async (req, res) => {
    const id = exigirCuentaPropia(req);
    const datos = req.body || {};

    const nombre = v.texto(datos.nombre, 'nombre', { min: 2, max: 100 });
    const correo = v.correo(datos.correo);
    const ubicacion = v.texto(datos.ubicacion, 'ubicacion', { min: 2, max: 150 });

    try {
        const { rowCount } = await db.query(
            `UPDATE usuarios
             SET nombre = $1, correo = $2, ubicacion = $3
             WHERE id = $4`,
            [nombre, correo, ubicacion, id]
        );

        if (rowCount === 0) {
            throw new ErrorApi(404, 'Usuario no encontrado');
        }

        res.json({ mensaje: 'Usuario actualizado correctamente' });
    } catch (error) {
        if (error.code === '23505') {
            throw new ErrorApi(409, 'El correo ya está registrado');
        }

        throw error;
    }
};

// ------------------------------------------------------
// Eliminar usuario (solo si no tiene actividad registrada)
// ------------------------------------------------------
const eliminarUsuario = async (req, res) => {
    const id = exigirCuentaPropia(req);

    try {
        const { rowCount } = await db.query('DELETE FROM usuarios WHERE id = $1', [id]);

        if (rowCount === 0) {
            throw new ErrorApi(404, 'Usuario no encontrado');
        }

        res.json({ mensaje: 'Usuario eliminado correctamente' });
    } catch (error) {
        if (error.code === '23503') {
            throw new ErrorApi(409, 'No puedes eliminar la cuenta porque tiene donaciones o solicitudes registradas');
        }

        throw error;
    }
};

module.exports = {
    registrarUsuario,
    iniciarSesion,
    obtenerPerfil,
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario
};
