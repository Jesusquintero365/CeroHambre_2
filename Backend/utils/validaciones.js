// ======================================================
// VALIDACIÓN DE DATOS DE ENTRADA Y ERRORES DE LA API
// ======================================================

const config = require('../Config/env');

// Error "esperado": se responde al cliente con su código y mensaje
class ErrorApi extends Error {
    constructor(estado, mensaje) {
        super(mensaje);
        this.estado = estado;
    }
}

const UNIDADES = ['kg', 'gramos', 'unidades', 'litros', 'porciones'];
const TIPOS_USUARIO = ['donante', 'organizacion'];

// Fecha de hoy (AAAA-MM-DD) en la zona horaria configurada
function hoy() {
    return new Intl.DateTimeFormat('en-CA', { timeZone: config.zonaHoraria }).format(new Date());
}

function texto(valor, campo, { min = 1, max = 150, obligatorio = true } = {}) {
    if (valor === undefined || valor === null || String(valor).trim() === '') {
        if (obligatorio) {
            throw new ErrorApi(400, `El campo "${campo}" es obligatorio`);
        }
        return null;
    }

    if (typeof valor !== 'string') {
        throw new ErrorApi(400, `El campo "${campo}" debe ser texto`);
    }

    const limpio = valor.trim();

    if (limpio.length < min || limpio.length > max) {
        throw new ErrorApi(400, `El campo "${campo}" debe tener entre ${min} y ${max} caracteres`);
    }

    return limpio;
}

function correo(valor) {
    const limpio = texto(valor, 'correo', { min: 5, max: 150 }).toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(limpio)) {
        throw new ErrorApi(400, 'El correo electrónico no tiene un formato válido');
    }

    return limpio;
}

function password(valor) {
    if (typeof valor !== 'string' || valor.length < 8) {
        throw new ErrorApi(400, 'La contraseña debe tener al menos 8 caracteres');
    }

    if (valor.length > 128) {
        throw new ErrorApi(400, 'La contraseña es demasiado larga');
    }

    return valor;
}

function numeroPositivo(valor, campo, { max = 100000 } = {}) {
    if (valor === undefined || valor === null || String(valor).trim() === '') {
        throw new ErrorApi(400, `El campo "${campo}" es obligatorio`);
    }

    const numero = Number(valor);

    if (!Number.isFinite(numero) || numero <= 0) {
        throw new ErrorApi(400, `El campo "${campo}" debe ser un número mayor que cero`);
    }

    if (numero > max) {
        throw new ErrorApi(400, `El campo "${campo}" no puede superar ${max}`);
    }

    return Math.round(numero * 100) / 100;
}

function opcion(valor, campo, permitidos) {
    if (!permitidos.includes(valor)) {
        throw new ErrorApi(400, `El campo "${campo}" debe ser uno de: ${permitidos.join(', ')}`);
    }

    return valor;
}

function fecha(valor, campo, { noPasada = false, obligatorio = true } = {}) {
    if (valor === undefined || valor === null || String(valor).trim() === '') {
        if (obligatorio) {
            throw new ErrorApi(400, `El campo "${campo}" es obligatorio`);
        }
        return null;
    }

    const texto = String(valor).slice(0, 10);

    if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
        throw new ErrorApi(400, `El campo "${campo}" debe tener el formato AAAA-MM-DD`);
    }

    const [anio, mes, dia] = texto.split('-').map(Number);
    const comprobada = new Date(Date.UTC(anio, mes - 1, dia));

    if (
        comprobada.getUTCFullYear() !== anio ||
        comprobada.getUTCMonth() !== mes - 1 ||
        comprobada.getUTCDate() !== dia
    ) {
        throw new ErrorApi(400, `El campo "${campo}" no es una fecha válida`);
    }

    if (noPasada && texto < hoy()) {
        throw new ErrorApi(400, `El campo "${campo}" no puede ser una fecha pasada`);
    }

    return texto;
}

function idEntero(valor, campo = 'id') {
    const numero = Number(valor);

    if (!Number.isInteger(numero) || numero <= 0 || numero > 2147483647) {
        throw new ErrorApi(400, `El identificador "${campo}" no es válido`);
    }

    return numero;
}

module.exports = {
    ErrorApi,
    UNIDADES,
    TIPOS_USUARIO,
    hoy,
    texto,
    correo,
    password,
    numeroPositivo,
    opcion,
    fecha,
    idEntero
};
