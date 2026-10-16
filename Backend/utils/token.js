// ======================================================
// TOKEN DE SESIÓN (JWT firmado con HS256)
// ======================================================
// Implementación mínima con el módulo nativo "crypto":
//   token = base64url(cabecera).base64url(datos).base64url(firma)
// Solo se aceptan tokens HS256 firmados con nuestra llave y no vencidos.

const crypto = require('crypto');

const CABECERA = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');

function firmar(contenido, llave) {
    return crypto.createHmac('sha256', llave).update(contenido).digest('base64url');
}

function crearToken(datos, llave, horasValidez) {
    const ahora = Math.floor(Date.now() / 1000);

    const cuerpo = Buffer.from(
        JSON.stringify({ ...datos, iat: ahora, exp: ahora + Math.round(horasValidez * 3600) })
    ).toString('base64url');

    const contenido = `${CABECERA}.${cuerpo}`;

    return `${contenido}.${firmar(contenido, llave)}`;
}

function verificarToken(token, llave) {
    const partes = String(token || '').split('.');

    if (partes.length !== 3 || partes[0] !== CABECERA) {
        throw new Error('Token inválido');
    }

    const esperada = Buffer.from(firmar(`${partes[0]}.${partes[1]}`, llave));
    const recibida = Buffer.from(partes[2]);

    if (esperada.length !== recibida.length || !crypto.timingSafeEqual(esperada, recibida)) {
        throw new Error('Firma inválida');
    }

    const datos = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'));

    if (!datos.exp || datos.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token vencido');
    }

    return datos;
}

module.exports = { crearToken, verificarToken };
