# CeroHambre · ODS 2 – Hambre Cero

Plataforma web que conecta a **donantes de alimentos** (restaurantes, panaderías, supermercados) con **organizaciones sociales** (fundaciones, comedores comunitarios, hogares infantiles) para recuperar alimentos aptos para el consumo antes de que se desperdicien y llevarlos a quienes los necesitan.

> 🌐 **Aplicación desplegada:** https://TU-APP.onrender.com  *(reemplazar por la URL real de Render)*
> 📦 **Repositorio:** https://github.com/TU-USUARIO/TU-REPOSITORIO  *(reemplazar)*

## 1. Objetivo de Desarrollo Sostenible

**ODS 2 – Hambre Cero** (Naciones Unidas): *poner fin al hambre, lograr la seguridad alimentaria y la mejora de la nutrición y promover la agricultura sostenible.*

La solución contribuye en dos frentes: **acceso a alimentos** para población vulnerable (meta 2.1) y **reducción del desperdicio** de alimentos en la cadena de suministro (relacionada con la meta 12.3). Cada alimento publicado, solicitado y entregado queda registrado, y la sección de **Reportes** muestra el impacto (kg recuperados, organizaciones atendidas, entregas realizadas).

## 2. Integrantes

| Integrante | Rol |
|---|---|
| Jesus Quintero | *(completar)* |
| *(nombre del integrante 2)* | *(completar)* |
| *(nombre del integrante 3)* | *(completar)* |

Universidad Cooperativa de Colombia · Desarrollo Sostenible · Momento 2.

## 3. ¿Qué hace el sistema?

| Rol | Acciones |
|---|---|
| **Donante** | Publica alimentos disponibles · recibe solicitudes · acepta o rechaza · registra la entrega y la marca *en camino* / *entregada*. |
| **Organización** | Consulta los alimentos disponibles · solicita una cantidad · sigue el estado de sus solicitudes y entregas. |
| **Todos** | Registro e inicio de sesión · panel principal con actividad reciente · reportes de impacto. |

Flujo: `Donación (disponible) → Solicitud (pendiente) → aceptada → donación reservada → Entrega (pendiente → en camino → entregada) → donación entregada, solicitud completada`.

**Vistas:** inicio · registro · inicio de sesión · dashboard · donaciones · publicar donación · solicitudes · entregas · reportes.

## 4. Tecnologías

| Capa | Tecnología |
|---|---|
| Frontend | HTML5, CSS3 y JavaScript (sin frameworks), servido por el mismo servidor |
| Backend | Node.js 18+ · Express 5 · API REST |
| Base de datos | **PostgreSQL** (driver `pg`) |
| Seguridad | Contraseñas con hash `scrypt` · sesiones con token firmado (JWT HS256) · permisos por rol · consultas parametrizadas · escape de HTML en el frontend |
| Despliegue | Render (servicio web + PostgreSQL) |

Arquitectura de tres capas: navegador (HTML/JS) → API REST (Express) → PostgreSQL. El backend sirve también los archivos del frontend, por eso el mismo enlace entrega la interfaz y la API (`/api/...`).

## 5. Estructura del repositorio

```
├── Backend/               Lógica de negocio, rutas y conexión a la BD
│   ├── Server.js          Punto de entrada (Express)
│   ├── Config/            Variables de entorno, pool de PostgreSQL, inicialización de la BD
│   ├── Routes/            Rutas de la API
│   ├── controllers/       Reglas de negocio y consultas SQL
│   ├── middleware/        Autenticación, permisos y manejo de errores
│   ├── utils/             Hash de contraseñas, token y validaciones
│   ├── scripts/           db:init / db:reset y utilidades
│   └── tests/             Pruebas automáticas de la API
├── Frontend/              Interfaz de usuario (HTML, CSS, JS)
├── database/              schema.sql, seed.sql, respaldo .sql y diagrama entidad-relación
├── docs/capturas/         Capturas del sistema en funcionamiento
├── .env.example           Variables de entorno necesarias (sin valores reales)
├── render.yaml            Despliegue automático en Render (Blueprint)
└── README.md
```

## 6. Instalación y ejecución local

**Requisitos:** Node.js 18 o superior y PostgreSQL 14 o superior.

```bash
# 1) Clonar
git clone https://github.com/TU-USUARIO/TU-REPOSITORIO.git
cd TU-REPOSITORIO

# 2) Crear la base de datos vacía
createdb cerohambre            # o en psql:  CREATE DATABASE cerohambre;

# 3) Variables de entorno
cp .env.example .env           # en Windows: copy .env.example .env
#    edita .env y escribe tu usuario/clave de PostgreSQL en DATABASE_URL

# 4) Instalar dependencias y arrancar
cd Backend
npm install
npm start
```

Abre **http://localhost:3000**. Al arrancar, la aplicación **crea las tablas y carga los datos de ejemplo** si la base está vacía (`database/schema.sql` y `database/seed.sql`). Para reiniciar la base: `npm run db:reset`.

### Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `DATABASE_URL` | Sí | Cadena de conexión de PostgreSQL. |
| `JWT_SECRET` | Sí en producción | Texto largo y aleatorio para firmar las sesiones. |
| `PORT` | No | Puerto del servidor (por defecto 3000; Render lo asigna). |
| `NODE_ENV` | No | `production` en el servidor desplegado. |
| `DATABASE_SSL` | No | `true` si la BD exige SSL (URL externa de Render). |
| `SESION_HORAS` | No | Duración de la sesión (8 por defecto). |
| `ZONA_HORARIA` | No | Para validar fechas (`America/Bogota` por defecto). |
| `CARGAR_DATOS_EJEMPLO` | No | `false` para no cargar datos de ejemplo. |

### Pruebas automáticas

Las pruebas usan una base **de pruebas** (la reinician; nunca apuntes a tu base real):

```bash
createdb cerohambre_test
cd Backend
DATABASE_URL_TEST=postgresql://postgres:TU_CLAVE@localhost:5432/cerohambre_test npm test
```

Opcionalmente, `docs/pruebas/e2e_ui.py` recorre el flujo completo desde el navegador (Playwright) sobre una base recién creada; ver las instrucciones al inicio del archivo.

## 7. Usuarios de prueba

| Tipo | Correo | Contraseña |
|---|---|---|
| Donante | `donante@cerohambre.com` | `Donante123*` |
| Organización | `organizacion@cerohambre.com` | `Organizacion123*` |

## 8. Despliegue en Render

**Opción A – Blueprint (recomendada)**
1. Sube el repositorio a GitHub.
2. En [Render](https://render.com): **New + → Blueprint** → elige el repositorio. Render lee `render.yaml` y crea la base PostgreSQL y el servicio web ya conectados.
3. Espera a que termine el despliegue y abre la URL `https://….onrender.com`.

**Opción B – Manual**
1. **New + → PostgreSQL** (plan Free). Copia la *Internal Database URL*.
2. **New + → Web Service** → repositorio de GitHub. Runtime **Node**.
   * Build Command: `npm install --prefix Backend`
   * Start Command: `node Backend/Server.js`
   * Health Check Path: `/api/salud`
3. Variables de entorno: `NODE_ENV=production`, `DATABASE_URL=<Internal Database URL>`, `JWT_SECRET=<texto aleatorio largo>`.

Cada `git push` a la rama principal vuelve a desplegar automáticamente, así la versión publicada corresponde siempre al código del repositorio. Las credenciales **no** están en el código: se configuran como variables de entorno en Render.

> ⚠️ En el plan gratuito de Render el servicio "se duerme" tras 15 minutos sin tráfico (la primera visita tarda ~1 minuto) y la base de datos gratuita **vence a los 30 días** de crearse. Crea la base cerca de la fecha de entrega y verifica que el enlace responda antes de enviarlo.

## 9. API REST

Las rutas marcadas 🔒 requieren la cabecera `Authorization: Bearer <token>` (el token se obtiene al iniciar sesión).

| Método | Ruta | Descripción | Acceso |
|---|---|---|---|
| POST | `/api/usuarios` | Registrar usuario | Público |
| POST | `/api/usuarios/login` | Iniciar sesión (devuelve usuario y token) | Público |
| GET | `/api/usuarios/yo` | Perfil del usuario autenticado | 🔒 |
| GET · PUT · DELETE | `/api/usuarios/:id` | Ver / editar / eliminar la propia cuenta | 🔒 |
| GET | `/api/donaciones` · `/api/donaciones/:id` | Listar / ver donaciones | Público |
| POST · PUT · DELETE | `/api/donaciones` · `/api/donaciones/:id` | Publicar / editar / eliminar | 🔒 Donante |
| GET | `/api/solicitudes` · `/:id` | Mis solicitudes | 🔒 |
| POST | `/api/solicitudes` | Solicitar una donación | 🔒 Organización |
| PUT | `/api/solicitudes/:id` | Aceptar o rechazar (`{"estado":"aceptada"}`) | 🔒 Donante |
| DELETE | `/api/solicitudes/:id` | Eliminar una solicitud pendiente | 🔒 Organización |
| GET | `/api/entregas` · `/:id` | Mis entregas | 🔒 |
| POST · PUT · DELETE | `/api/entregas` · `/:id` | Registrar / cambiar estado / eliminar | 🔒 Donante |
| GET | `/api/reportes` | Indicadores de impacto | Público |
| GET | `/api/salud` | Estado del servidor y de la BD | Público |

Los errores se devuelven como JSON `{ "mensaje": "..." }` con el código HTTP adecuado (400 datos inválidos, 401 sin sesión, 403 sin permiso, 404 no existe, 409 conflicto con el estado actual).

## 10. Validación de datos y manejo de errores

* **Entrada:** tipos, longitudes, formato de correo, cantidades positivas, unidades y estados permitidos, fechas válidas y no vencidas, identificadores numéricos. Se valida en el navegador (atributos HTML) **y** en el servidor.
* **Reglas de negocio:** no se solicita más de lo disponible; no se solicitan donaciones vencidas ni reservadas; no hay solicitudes activas duplicadas; solo el dueño de la donación acepta o entrega; las transiciones de estado son válidas (p. ej. una entrega ya realizada no vuelve atrás). Las operaciones de varios pasos usan transacciones.
* **Errores:** manejador central; ningún dato incorrecto tumba el servidor y el usuario ve un mensaje claro.
* **Seguridad:** consultas parametrizadas (sin inyección SQL), contraseñas con hash, texto de usuarios escapado antes de mostrarse (sin XSS), `.env` fuera del repositorio.

## 11. Decisiones técnicas respecto a la primera versión

* **MySQL → PostgreSQL:** Render ofrece PostgreSQL administrado y gratuito (no MySQL), y la actividad exige un motor propio y persistente (PostgreSQL, MySQL o SQLite).
* **Conexión con variables de entorno y pool de conexiones**, en lugar de usuario/clave escritos en el código y una única conexión.
* **Contraseñas con hash y sesiones con token** (antes se guardaban y comparaban en texto plano).
* **Permisos por rol en el servidor** (antes bastaba con enviar el `usuario_id` desde el navegador).
