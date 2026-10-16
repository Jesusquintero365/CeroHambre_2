# Base de datos · CeroHambre

Motor: **PostgreSQL 14 o superior** (en producción, PostgreSQL de Render).

| Archivo | Para qué sirve |
|---|---|
| `schema.sql` | Esquema completo: tablas, tipos, llaves primarias, llaves foráneas, restricciones (`CHECK`, `UNIQUE`) e índices. Es idempotente (`IF NOT EXISTS`). |
| `seed.sql` | Datos de ejemplo (6 usuarios, 9 donaciones, 8 solicitudes, 4 entregas) con fechas relativas a "hoy". |
| `cerohambre_backup.sql` | Copia de respaldo (`pg_dump`) de la base ya creada con el esquema **y** los datos de ejemplo. Se restaura de una sola vez. |
| `DER.png` / `DER.svg` | Diagrama entidad-relación generado desde la base real. |
| `herramientas/generar_der.py` | Script que vuelve a generar el DER leyendo la base de datos. |

## Modelo de datos

```
usuarios (donante)       1 ──< N  donaciones
donaciones               1 ──< N  solicitudes
usuarios (organizacion)  1 ──< N  solicitudes
solicitudes              1 ──  0..1 entregas
```

* **usuarios**: `tipo_usuario` ∈ {`donante`, `organizacion`}. La contraseña se guarda como hash `scrypt` (`password_hash`).
* **donaciones**: `unidad` ∈ {kg, gramos, unidades, litros, porciones}; `estado` ∈ {disponible, reservado, entregado}. Una donación "disponible" con fecha de vencimiento pasada se muestra como *vencida* (se calcula al consultar, no se guarda).
* **solicitudes**: `estado` ∈ {pendiente, aceptada, rechazada, completada}. Un índice único parcial impide que una organización tenga dos solicitudes activas para la misma donación.
* **entregas**: `solicitud_id` es único (una entrega por solicitud); `estado` ∈ {pendiente, en_camino, entregada, cancelada}.
* Todas las llaves foráneas usan `ON DELETE RESTRICT`: no se puede borrar un registro que tiene información relacionada.

**Tercera Forma Normal (3FN):** cada tabla tiene llave primaria simple; todos los atributos dependen solo de la llave (no hay dependencias parciales ni transitivas: los datos del donante y de la organización viven en `usuarios`, los del alimento en `donaciones`, etc.); los dominios cerrados (unidad, estado) se controlan con `CHECK`.

Reglas de negocio que se validan en la API (no solo en la BD): la cantidad solicitada no puede superar la disponible; no se solicitan donaciones vencidas o ya reservadas; al aceptar una solicitud la donación pasa a *reservado* y las demás solicitudes pendientes se rechazan; al marcar una entrega como *entregada* la solicitud pasa a *completada* y la donación a *entregado*.

## Crear la base de datos

La aplicación crea las tablas (y carga los datos de ejemplo si la base está vacía) **sola, al arrancar**. Si prefieres hacerlo a mano:

```bash
# 1) Crear la base vacía
createdb cerohambre            # o:  psql -U postgres -c "CREATE DATABASE cerohambre"

# 2a) Esquema + datos de ejemplo
psql -d cerohambre -f database/schema.sql
psql -d cerohambre -f database/seed.sql

# 2b) ...o restaurar el respaldo completo (reemplaza a 2a)
psql -d cerohambre -f database/cerohambre_backup.sql
```

En Render (conexión externa): `psql "<External Database URL>" -f database/schema.sql` y después `seed.sql`.

> El respaldo guarda fechas absolutas del día en que se generó; si pasan semanas, algunas donaciones aparecerán como *vencidas*. `seed.sql` (o el arranque automático) siempre genera fechas nuevas.

## Regenerar el diagrama (opcional)

```bash
pip install playwright && playwright install chromium    # solo para exportar el PNG
python3 database/herramientas/generar_der.py "postgresql://postgres:postgres@localhost:5432/cerohambre"
```

## Usuarios de prueba

| Tipo | Correo | Contraseña |
|---|---|---|
| Donante | `donante@cerohambre.com` | `Donante123*` |
| Organización | `organizacion@cerohambre.com` | `Organizacion123*` |

Los demás donantes (`panaderia@`, `supermercado@`) y organizaciones (`comedor@`, `hogar@`) usan las mismas claves por tipo.
