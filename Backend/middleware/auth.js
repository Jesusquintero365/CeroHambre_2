// ======================================================
// AUTENTICACIÓN Y PERMISOS
// ======================================================
// El frontend envía el token en la cabecera:
//     Authorization: Bearer <token>

const config = require('../Config/env');
const { verificarToken } = require('../utils/token');
const { ErrorApi } = require('../utils/validaciones');

// Exige una sesión válida y deja los datos en req.usuario
function autenticar(req, res, next) {
    const cabecera = req.headers.authorization || '';
    const [tipo, token] = cabecera.split(' ');

    if (tipo !== 'Bearer' || !token) {
        return next(new ErrorApi(401, 'Debes iniciar sesión para realizar esta acción'));
    }

    try {
        const datos = verificarToken(token, config.jwtSecret);

        req.usuario = {
            id: datos.id,
            nombre: datos.nombre,
            tipo_usuario: datos.tipo_usuario
        };

        next();
    } catch (error) {
        next(new ErrorApi(401, 'Tu sesión no es válida o expiró. Inicia sesión nuevamente'));
    }
}

// Exige que el usuario tenga uno de los roles indicados
function permitirRoles(...roles) {
    return (req, res, next) => {
        if (!req.usuario || !roles.includes(req.usuario.tipo_usuario)) {
            return next(new ErrorApi(403, 'Tu tipo de usuario no tiene permiso para esta acción'));
        }

        next();
    };
}

module.exports = { autenticar, permitirRoles };
