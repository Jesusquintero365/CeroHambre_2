const mysql = require('mysql2');

const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'ODS_2',
    port: 3306
});

connection.connect((error) => {
    if (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        return;
    }

    console.log(' Conexión exitosa con la base de datos ODS_2');
});

module.exports = connection;