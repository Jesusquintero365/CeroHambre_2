// Genera el hash de una contraseña (útil para crear usuarios a mano en la BD)
//   node scripts/generar-hash.js MiClave123
const { hashPassword } = require('../utils/password');

const clave = process.argv[2];

if (!clave) {
    console.error('Uso: node scripts/generar-hash.js <contraseña>');
    process.exit(1);
}

hashPassword(clave).then((hash) => console.log(hash));
