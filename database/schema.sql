-- =====================================================================
--  CeroHambre · ODS 2 – Hambre Cero
--  Esquema de la base de datos · PostgreSQL 14+
--
--  Es idempotente (IF NOT EXISTS): se puede ejecutar varias veces.
--  Modelo normalizado hasta la Tercera Forma Normal (3FN).
--
--  Relaciones:
--    usuarios (donante)      1 ──< N  donaciones
--    donaciones              1 ──< N  solicitudes
--    usuarios (organizacion) 1 ──< N  solicitudes
--    solicitudes             1 ──  0..1 entregas
-- =====================================================================

-- ---------------------------------------------------------------------
--  USUARIOS: donantes (restaurantes, tiendas, productores) y
--            organizaciones receptoras (fundaciones, comedores)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id              INTEGER GENERATED ALWAYS AS IDENTITY,
    nombre          VARCHAR(100) NOT NULL,
    correo          VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,           -- scrypt, nunca texto plano
    tipo_usuario    VARCHAR(20)  NOT NULL,
    ubicacion       VARCHAR(150) NOT NULL,
    fecha_registro  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT usuarios_pk          PRIMARY KEY (id),
    CONSTRAINT usuarios_correo_uk   UNIQUE (correo),
    CONSTRAINT usuarios_correo_ck   CHECK (correo = LOWER(correo)),
    CONSTRAINT usuarios_tipo_ck     CHECK (tipo_usuario IN ('donante', 'organizacion'))
);

-- ---------------------------------------------------------------------
--  DONACIONES: alimentos que un donante publica
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donaciones (
    id                  INTEGER GENERATED ALWAYS AS IDENTITY,
    usuario_id          INTEGER        NOT NULL,       -- donante que publica
    alimento            VARCHAR(120)   NOT NULL,
    cantidad            NUMERIC(10, 2) NOT NULL,
    unidad              VARCHAR(20)    NOT NULL,
    fecha_vencimiento   DATE           NOT NULL,
    ubicacion           VARCHAR(150)   NOT NULL,       -- lugar de recogida
    descripcion         TEXT,
    estado              VARCHAR(20)    NOT NULL DEFAULT 'disponible',
    fecha_publicacion   TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT donaciones_pk          PRIMARY KEY (id),
    CONSTRAINT donaciones_usuario_fk  FOREIGN KEY (usuario_id)
        REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT donaciones_cantidad_ck CHECK (cantidad > 0),
    CONSTRAINT donaciones_unidad_ck   CHECK (unidad IN ('kg', 'gramos', 'unidades', 'litros', 'porciones')),
    CONSTRAINT donaciones_estado_ck   CHECK (estado IN ('disponible', 'reservado', 'entregado'))
);

-- ---------------------------------------------------------------------
--  SOLICITUDES: una organización pide (parte de) una donación
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solicitudes (
    id                    INTEGER GENERATED ALWAYS AS IDENTITY,
    donacion_id           INTEGER        NOT NULL,
    organizacion_id       INTEGER        NOT NULL,     -- usuario tipo 'organizacion'
    cantidad_solicitada   NUMERIC(10, 2) NOT NULL,
    estado                VARCHAR(20)    NOT NULL DEFAULT 'pendiente',
    fecha_solicitud       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT solicitudes_pk              PRIMARY KEY (id),
    CONSTRAINT solicitudes_donacion_fk     FOREIGN KEY (donacion_id)
        REFERENCES donaciones (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT solicitudes_organizacion_fk FOREIGN KEY (organizacion_id)
        REFERENCES usuarios (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT solicitudes_cantidad_ck     CHECK (cantidad_solicitada > 0),
    CONSTRAINT solicitudes_estado_ck       CHECK (estado IN ('pendiente', 'aceptada', 'rechazada', 'completada'))
);

-- Una organización no puede tener dos solicitudes activas para la misma donación
CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_activa_uk
    ON solicitudes (donacion_id, organizacion_id)
    WHERE estado IN ('pendiente', 'aceptada');

-- ---------------------------------------------------------------------
--  ENTREGAS: seguimiento logístico de una solicitud aceptada (1 a 1)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entregas (
    id              INTEGER GENERATED ALWAYS AS IDENTITY,
    solicitud_id    INTEGER      NOT NULL,
    fecha_entrega   DATE,
    estado          VARCHAR(20)  NOT NULL DEFAULT 'pendiente',
    observaciones   TEXT,

    CONSTRAINT entregas_pk           PRIMARY KEY (id),
    CONSTRAINT entregas_solicitud_uk UNIQUE (solicitud_id),
    CONSTRAINT entregas_solicitud_fk FOREIGN KEY (solicitud_id)
        REFERENCES solicitudes (id) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT entregas_estado_ck    CHECK (estado IN ('pendiente', 'en_camino', 'entregada', 'cancelada'))
);

-- ---------------------------------------------------------------------
--  ÍNDICES sobre llaves foráneas y columnas de consulta frecuente
-- ---------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS donaciones_usuario_idx      ON donaciones (usuario_id);
CREATE INDEX IF NOT EXISTS donaciones_estado_idx       ON donaciones (estado);
CREATE INDEX IF NOT EXISTS solicitudes_donacion_idx    ON solicitudes (donacion_id);
CREATE INDEX IF NOT EXISTS solicitudes_organizacion_idx ON solicitudes (organizacion_id);
