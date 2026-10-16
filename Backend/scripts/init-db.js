// Uso:  npm run db:init      -> crea tablas y datos de ejemplo si no existen
//       npm run db:reset     -> borra todo y vuelve a crearlo
const { inicializarBD } = require('../Config/initDb');
const { pool } = require('../Config/database');

const reiniciar = process.argv.includes('--reset');

inicializarBD({ reiniciar })
    .then(() => {
        console.log('✅ Base de datos lista.');
    })
    .catch((error) => {
        console.error('❌ No se pudo inicializar la base de datos:', error.message);
        process.exitCode = 1;
    })
    .finally(() => pool.end());
