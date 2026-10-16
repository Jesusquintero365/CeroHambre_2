// ======================================================
// PRUEBAS DE LA API (node --test)
// ======================================================
// Usan una base de datos REAL y LA REINICIAN (borran las tablas), por eso
// solo se ejecutan si defines DATABASE_URL_TEST apuntando a una BD de pruebas:
//
//   DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/cerohambre_test npm test

const test = require('node:test');
const assert = require('node:assert/strict');

const urlPruebas = process.env.DATABASE_URL_TEST;

if (!urlPruebas) {
    test('pruebas de API omitidas (falta DATABASE_URL_TEST)', { skip: true }, () => {});
    return;
}

process.env.DATABASE_URL = urlPruebas;
process.env.CARGAR_DATOS_EJEMPLO = 'false';
process.env.JWT_SECRET = 'clave-de-pruebas';

const { app } = require('../Server');
const { inicializarBD } = require('../Config/initDb');
const { pool } = require('../Config/database');

let servidor;
let base;

const manana = () => {
    const d = new Date(Date.now() + 2 * 86400000);
    return d.toISOString().slice(0, 10);
};

async function api(metodo, ruta, { cuerpo, token } = {}) {
    const respuesta = await fetch(`${base}/api${ruta}`, {
        method: metodo,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });

    return { estado: respuesta.status, datos: await respuesta.json() };
}

async function registrarYEntrar(nombre, correo, tipo) {
    const registro = await api('POST', '/usuarios', {
        cuerpo: { nombre, correo, password: 'Clave12345', tipo_usuario: tipo, ubicacion: 'Bogotá' }
    });
    assert.equal(registro.estado, 201);

    const login = await api('POST', '/usuarios/login', { cuerpo: { correo, password: 'Clave12345' } });
    assert.equal(login.estado, 200);

    return { id: login.datos.usuario.id, token: login.datos.token };
}

test.before(async () => {
    await inicializarBD({ reiniciar: true });
    servidor = app.listen(0);
    base = `http://127.0.0.1:${servidor.address().port}`;
});

test.after(async () => {
    servidor.close();
    await pool.end();
});

test('salud: la API responde y la base está conectada', async () => {
    const r = await api('GET', '/salud');
    assert.equal(r.estado, 200);
    assert.equal(r.datos.baseDeDatos, 'conectada');
});

test('usuarios: validaciones de registro', async () => {
    const base = { nombre: 'Ana', correo: 'ana@correo.com', password: 'Clave12345', tipo_usuario: 'donante', ubicacion: 'Cali' };

    for (const [cambio, texto] of [
        [{ correo: 'no-es-correo' }, /correo/i],
        [{ password: '123' }, /contraseña/i],
        [{ tipo_usuario: 'admin' }, /tipo_usuario/],
        [{ nombre: '' }, /nombre/],
        [{ ubicacion: undefined }, /ubicacion/]
    ]) {
        const r = await api('POST', '/usuarios', { cuerpo: { ...base, ...cambio } });
        assert.equal(r.estado, 400, JSON.stringify(cambio));
        assert.match(r.datos.mensaje, texto);
    }
});

test('usuarios: correo duplicado, contraseña con hash y login', async () => {
    await registrarYEntrar('Dona Uno', 'dup@correo.com', 'donante');

    const repetido = await api('POST', '/usuarios', {
        cuerpo: { nombre: 'Otro', correo: 'DUP@correo.com', password: 'Clave12345', tipo_usuario: 'donante', ubicacion: 'Cali' }
    });
    assert.equal(repetido.estado, 409);

    const { rows } = await pool.query(`SELECT password_hash FROM usuarios WHERE correo = 'dup@correo.com'`);
    assert.match(rows[0].password_hash, /^scrypt\$/);
    assert.ok(!rows[0].password_hash.includes('Clave12345'));

    const mala = await api('POST', '/usuarios/login', { cuerpo: { correo: 'dup@correo.com', password: 'incorrecta1' } });
    assert.equal(mala.estado, 401);

    const inexistente = await api('POST', '/usuarios/login', { cuerpo: { correo: 'nadie@correo.com', password: 'Clave12345' } });
    assert.equal(inexistente.estado, 401);
});

test('seguridad: rutas protegidas exigen token y respetan el rol', async () => {
    assert.equal((await api('GET', '/solicitudes')).estado, 401);
    assert.equal((await api('GET', '/entregas')).estado, 401);
    assert.equal((await api('POST', '/donaciones', { cuerpo: {} })).estado, 401);
    assert.equal((await api('GET', '/solicitudes', { token: 'basura.basura.basura' })).estado, 401);

    const org = await registrarYEntrar('Org Rol', 'orgrol@correo.com', 'organizacion');
    const prohibido = await api('POST', '/donaciones', {
        token: org.token,
        cuerpo: { alimento: 'Arroz', cantidad: 5, unidad: 'kg', fecha_vencimiento: manana(), ubicacion: 'Bogotá' }
    });
    assert.equal(prohibido.estado, 403);

    const json = await fetch(`${base}/api/usuarios`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{malo' });
    assert.equal(json.status, 400);

    assert.equal((await api('GET', '/ruta-que-no-existe')).estado, 404);
});

test('donaciones: validación de datos de entrada', async () => {
    const donante = await registrarYEntrar('Dona Val', 'donaval@correo.com', 'donante');
    const valida = { alimento: 'Pan', cantidad: 10, unidad: 'unidades', fecha_vencimiento: manana(), ubicacion: 'Bogotá' };

    for (const cambio of [
        { cantidad: -5 }, { cantidad: 0 }, { cantidad: 'abc' }, { unidad: 'toneladas' },
        { fecha_vencimiento: '2020-01-01' }, { fecha_vencimiento: '2026-02-31' }, { fecha_vencimiento: 'mañana' },
        { alimento: '' }, { ubicacion: '' }
    ]) {
        const r = await api('POST', '/donaciones', { token: donante.token, cuerpo: { ...valida, ...cambio } });
        assert.equal(r.estado, 400, JSON.stringify(cambio));
    }

    const ok = await api('POST', '/donaciones', { token: donante.token, cuerpo: valida });
    assert.equal(ok.estado, 201);

    const lista = await api('GET', '/donaciones');
    assert.equal(lista.estado, 200);
    const creada = lista.datos.find((d) => d.id === ok.datos.id);
    assert.equal(creada.estado, 'disponible');
    assert.equal(creada.cantidad, 10);
    assert.equal(typeof creada.cantidad, 'number');
    assert.match(creada.fecha_vencimiento, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal(creada.donante, 'Dona Val');
});

test('flujo completo: donar → solicitar → aceptar → entregar → reportes', async () => {
    const donante = await registrarYEntrar('Dona Flujo', 'flujo.d@correo.com', 'donante');
    const otroDonante = await registrarYEntrar('Otro Donante', 'flujo.d2@correo.com', 'donante');
    const org1 = await registrarYEntrar('Org Uno', 'flujo.o1@correo.com', 'organizacion');
    const org2 = await registrarYEntrar('Org Dos', 'flujo.o2@correo.com', 'organizacion');

    const don = await api('POST', '/donaciones', {
        token: donante.token,
        cuerpo: { alimento: 'Lentejas flujo', cantidad: 40, unidad: 'kg', fecha_vencimiento: manana(), ubicacion: 'Bogotá' }
    });
    const donacionId = don.datos.id;

    // Reglas de la solicitud
    const mucho = await api('POST', '/solicitudes', { token: org1.token, cuerpo: { donacion_id: donacionId, cantidad_solicitada: 41 } });
    assert.equal(mucho.estado, 400);
    assert.match(mucho.datos.mensaje, /disponible/);

    const negativa = await api('POST', '/solicitudes', { token: org1.token, cuerpo: { donacion_id: donacionId, cantidad_solicitada: -1 } });
    assert.equal(negativa.estado, 400);

    const inexistente = await api('POST', '/solicitudes', { token: org1.token, cuerpo: { donacion_id: 999999, cantidad_solicitada: 1 } });
    assert.equal(inexistente.estado, 404);

    const delDonante = await api('POST', '/solicitudes', { token: donante.token, cuerpo: { donacion_id: donacionId, cantidad_solicitada: 1 } });
    assert.equal(delDonante.estado, 403);

    const s1 = await api('POST', '/solicitudes', { token: org1.token, cuerpo: { donacion_id: donacionId, cantidad_solicitada: 25 } });
    assert.equal(s1.estado, 201);

    const duplicada = await api('POST', '/solicitudes', { token: org1.token, cuerpo: { donacion_id: donacionId, cantidad_solicitada: 5 } });
    assert.equal(duplicada.estado, 409);

    const s2 = await api('POST', '/solicitudes', { token: org2.token, cuerpo: { donacion_id: donacionId, cantidad_solicitada: 10 } });
    assert.equal(s2.estado, 201);

    // Visibilidad por rol
    const vistaDonante = await api('GET', '/solicitudes', { token: donante.token });
    assert.equal(vistaDonante.datos.length, 2);
    assert.equal((await api('GET', '/solicitudes', { token: otroDonante.token })).datos.length, 0);
    assert.equal((await api('GET', '/solicitudes', { token: org1.token })).datos.length, 1);
    assert.equal((await api('GET', `/solicitudes/${s1.datos.id}`, { token: org2.token })).estado, 403);

    // Solo el dueño puede aceptar
    const intruso = await api('PUT', `/solicitudes/${s1.datos.id}`, { token: otroDonante.token, cuerpo: { estado: 'aceptada' } });
    assert.equal(intruso.estado, 403);
    const deOrg = await api('PUT', `/solicitudes/${s1.datos.id}`, { token: org1.token, cuerpo: { estado: 'aceptada' } });
    assert.equal(deOrg.estado, 403);
    const invalido = await api('PUT', `/solicitudes/${s1.datos.id}`, { token: donante.token, cuerpo: { estado: 'completada' } });
    assert.equal(invalido.estado, 400);

    // No se puede crear entrega de una solicitud no aceptada
    const prematura = await api('POST', '/entregas', { token: donante.token, cuerpo: { solicitud_id: s1.datos.id } });
    assert.equal(prematura.estado, 409);

    // Aceptar: la donación se reserva y la otra solicitud se rechaza
    const acepta = await api('PUT', `/solicitudes/${s1.datos.id}`, { token: donante.token, cuerpo: { estado: 'aceptada' } });
    assert.equal(acepta.estado, 200);

    const donacion = (await api('GET', `/donaciones/${donacionId}`)).datos;
    assert.equal(donacion.estado, 'reservado');

    const solicitudes = (await api('GET', '/solicitudes', { token: donante.token })).datos;
    assert.equal(solicitudes.find((s) => s.id === s1.datos.id).estado, 'aceptada');
    assert.equal(solicitudes.find((s) => s.id === s2.datos.id).estado, 'rechazada');

    const otraVez = await api('PUT', `/solicitudes/${s1.datos.id}`, { token: donante.token, cuerpo: { estado: 'aceptada' } });
    assert.equal(otraVez.estado, 409);

    // No se puede solicitar una donación ya reservada
    const reservada = await api('POST', '/solicitudes', { token: org2.token, cuerpo: { donacion_id: donacionId, cantidad_solicitada: 1 } });
    assert.equal(reservada.estado, 409);

    // Entrega
    const entrega = await api('POST', '/entregas', { token: donante.token, cuerpo: { solicitud_id: s1.datos.id } });
    assert.equal(entrega.estado, 201);
    const entregaId = entrega.datos.id;

    const repetida = await api('POST', '/entregas', { token: donante.token, cuerpo: { solicitud_id: s1.datos.id } });
    assert.equal(repetida.estado, 409);

    assert.equal((await api('PUT', `/entregas/${entregaId}`, { token: org1.token, cuerpo: { estado: 'entregada' } })).estado, 403);
    assert.equal((await api('PUT', `/entregas/${entregaId}`, { token: donante.token, cuerpo: { estado: 'volando' } })).estado, 400);

    assert.equal((await api('PUT', `/entregas/${entregaId}`, { token: donante.token, cuerpo: { estado: 'en_camino' } })).estado, 200);

    const antes = (await api('GET', '/reportes')).datos.datos;
    assert.equal(antes.entregas_realizadas, 0);

    assert.equal((await api('PUT', `/entregas/${entregaId}`, { token: donante.token, cuerpo: { estado: 'entregada' } })).estado, 200);
    assert.equal((await api('PUT', `/entregas/${entregaId}`, { token: donante.token, cuerpo: { estado: 'en_camino' } })).estado, 409);

    const ent = (await api('GET', `/entregas/${entregaId}`, { token: org1.token })).datos;
    assert.equal(ent.estado, 'entregada');
    assert.ok(ent.fecha_entrega, 'se asigna la fecha de entrega');
    assert.equal((await api('GET', `/entregas/${entregaId}`, { token: org2.token })).estado, 403);

    assert.equal((await api('GET', `/donaciones/${donacionId}`)).datos.estado, 'entregado');
    const sFinal = (await api('GET', `/solicitudes/${s1.datos.id}`, { token: org1.token })).datos;
    assert.equal(sFinal.estado, 'completada');

    assert.equal((await api('DELETE', `/entregas/${entregaId}`, { token: donante.token })).estado, 409);

    // Reportes
    const rep = await api('GET', '/reportes');
    assert.equal(rep.estado, 200);
    assert.equal(rep.datos.datos.alimentos_recuperados, 25);
    assert.equal(rep.datos.datos.entregas_realizadas, 1);
    assert.equal(rep.datos.datos.organizaciones_beneficiadas, 1);
    assert.deepEqual(rep.datos.por_unidad, [{ unidad: 'kg', total: 25 }]);
    assert.ok(rep.datos.donaciones_por_estado.some((e) => e.estado === 'entregado' && e.total === 1));
});

test('entrega cancelada: la donación vuelve a estar disponible', async () => {
    const donante = await registrarYEntrar('Dona Cancel', 'cancel.d@correo.com', 'donante');
    const org = await registrarYEntrar('Org Cancel', 'cancel.o@correo.com', 'organizacion');

    const don = await api('POST', '/donaciones', {
        token: donante.token,
        cuerpo: { alimento: 'Pan cancel', cantidad: 20, unidad: 'unidades', fecha_vencimiento: manana(), ubicacion: 'Bogotá' }
    });
    const sol = await api('POST', '/solicitudes', { token: org.token, cuerpo: { donacion_id: don.datos.id, cantidad_solicitada: 20 } });
    await api('PUT', `/solicitudes/${sol.datos.id}`, { token: donante.token, cuerpo: { estado: 'aceptada' } });
    const ent = await api('POST', '/entregas', { token: donante.token, cuerpo: { solicitud_id: sol.datos.id } });

    assert.equal((await api('PUT', `/entregas/${ent.datos.id}`, { token: donante.token, cuerpo: { estado: 'cancelada' } })).estado, 200);
    assert.equal((await api('GET', `/donaciones/${don.datos.id}`)).datos.estado, 'disponible');
});

test('cuentas: solo se gestiona la propia y no se borra con actividad', async () => {
    const donante = await registrarYEntrar('Dona Cuenta', 'cuenta.d@correo.com', 'donante');
    const otro = await registrarYEntrar('Otro Cuenta', 'cuenta.o@correo.com', 'donante');

    assert.equal((await api('GET', `/usuarios/${otro.id}`, { token: donante.token })).estado, 403);
    assert.equal((await api('DELETE', `/usuarios/${otro.id}`, { token: donante.token })).estado, 403);

    const perfil = await api('GET', '/usuarios/yo', { token: donante.token });
    assert.equal(perfil.datos.correo, 'cuenta.d@correo.com');
    assert.equal(perfil.datos.password_hash, undefined);

    const lista = await api('GET', '/usuarios', { token: donante.token });
    assert.ok(lista.datos.every((u) => u.correo === undefined && u.password_hash === undefined));

    await api('POST', '/donaciones', {
        token: donante.token,
        cuerpo: { alimento: 'Sopa', cantidad: 3, unidad: 'litros', fecha_vencimiento: manana(), ubicacion: 'Bogotá' }
    });
    const borrar = await api('DELETE', `/usuarios/${donante.id}`, { token: donante.token });
    assert.equal(borrar.estado, 409);

    assert.equal((await api('DELETE', `/usuarios/${otro.id}`, { token: otro.token })).estado, 200);
});
