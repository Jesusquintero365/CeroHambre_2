// ======================================================
// CONTRASEÑAS: hash con scrypt (módulo nativo de Node)
// ======================================================
// Formato guardado: scrypt$N$r$p$salt(base64)$hash(base64)
// Nunca se guarda la contraseña en texto plano.

const crypto = require('crypto');
const { promisify } = require('util');

const scrypt = promisify(crypto.scrypt);

const N = 16384;
const R = 8;
const P = 1;
const LONGITUD_LLAVE = 64;

async function hashPassword(passwordPlano) {
    const salt = crypto.randomBytes(16);
    const llave = await scrypt(passwordPlano, salt, LONGITUD_LLAVE, { N, r: R, p: P });

    return ['scrypt', N, R, P, salt.toString('base64'), llave.toString('base64')].join('$');
}

async function verificarPassword(passwordPlano, guardado) {
    try {
        const [algoritmo, n, r, p, saltB64, llaveB64] = String(guardado).split('$');

        if (algoritmo !== 'scrypt') {
            return false;
        }

        const esperado = Buffer.from(llaveB64, 'base64');

        const calculado = await scrypt(
            passwordPlano,
            Buffer.from(saltB64, 'base64'),
            esperado.length,
            { N: Number(n), r: Number(r), p: Number(p) }
        );

        return crypto.timingSafeEqual(calculado, esperado);
    } catch (error) {
        return false;
    }
}

module.exports = { hashPassword, verificarPassword };
