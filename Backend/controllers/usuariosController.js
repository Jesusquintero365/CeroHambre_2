const db = require('../Config/database');

// Registrar usuario
const registrarUsuario = (req, res) => {
    const { nombre, correo, password, tipo_usuario, ubicacion } = req.body;

    if (!nombre || !correo || !password || !tipo_usuario) {
        return res.status(400).json({
            mensaje: 'Faltan datos obligatorios'
        });
    }

    const sql = `
        INSERT INTO usuarios 
        (nombre, correo, password, tipo_usuario, ubicacion)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [nombre, correo, password, tipo_usuario, ubicacion || null],
        (error, resultado) => {
            if (error) {
                console.error(error);

                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(400).json({
                        mensaje: 'El correo ya está registrado'
                    });
                }

                return res.status(500).json({
                    mensaje: 'Error al registrar el usuario'
                });
            }

            res.status(201).json({
                mensaje: 'Usuario registrado correctamente',
                id: resultado.insertId
            });
        }
    );
};

// Obtener todos los usuarios
const obtenerUsuarios = (req, res) => {
    const sql = `
        SELECT id, nombre, correo, tipo_usuario, ubicacion, fecha_registro
        FROM usuarios
    `;

    db.query(sql, (error, resultados) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al consultar los usuarios'
            });
        }

        res.json(resultados);
    });
};

// Obtener un usuario por ID
const obtenerUsuarioPorId = (req, res) => {
    const { id } = req.params;

    const sql = `
        SELECT id, nombre, correo, tipo_usuario, ubicacion, fecha_registro
        FROM usuarios
        WHERE id = ?
    `;

    db.query(sql, [id], (error, resultados) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al consultar el usuario'
            });
        }

        if (resultados.length === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json(resultados[0]);
    });
};

// Actualizar usuario
const actualizarUsuario = (req, res) => {
    const { id } = req.params;
    const { nombre, correo, tipo_usuario, ubicacion } = req.body;

    const sql = `
        UPDATE usuarios
        SET nombre = ?, correo = ?, tipo_usuario = ?, ubicacion = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [nombre, correo, tipo_usuario, ubicacion || null, id],
        (error, resultado) => {
            if (error) {
                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al actualizar el usuario'
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Usuario no encontrado'
                });
            }

            res.json({
                mensaje: 'Usuario actualizado correctamente'
            });
        }
    );
};

// Eliminar usuario
const eliminarUsuario = (req, res) => {
    const { id } = req.params;

    const sql = 'DELETE FROM usuarios WHERE id = ?';

    db.query(sql, [id], (error, resultado) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al eliminar el usuario'
            });
        }

        if (resultado.affectedRows === 0) {
            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            mensaje: 'Usuario eliminado correctamente'
        });
    });
};
// Iniciar sesión
const iniciarSesion = (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({
            mensaje: 'El correo y la contraseña son obligatorios'
        });
    }

    const sql = `
        SELECT
            id,
            nombre,
            correo,
            password,
            tipo_usuario,
            ubicacion
        FROM usuarios
        WHERE correo = ?
    `;

    db.query(sql, [correo], (error, resultados) => {
        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al iniciar sesión'
            });
        }

        if (resultados.length === 0) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        const usuario = resultados[0];

        if (usuario.password !== password) {
            return res.status(401).json({
                mensaje: 'Correo o contraseña incorrectos'
            });
        }

        delete usuario.password;

        res.json({
            mensaje: 'Inicio de sesión exitoso',
            usuario: usuario
        });
    });
};

module.exports = {
    registrarUsuario,
    iniciarSesion,
    obtenerUsuarios,
    obtenerUsuarioPorId,
    actualizarUsuario,
    eliminarUsuario
};
