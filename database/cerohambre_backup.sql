--
-- PostgreSQL database dump
--


-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: donaciones; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.donaciones (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    alimento character varying(120) NOT NULL,
    cantidad numeric(10,2) NOT NULL,
    unidad character varying(20) NOT NULL,
    fecha_vencimiento date NOT NULL,
    ubicacion character varying(150) NOT NULL,
    descripcion text,
    estado character varying(20) DEFAULT 'disponible'::character varying NOT NULL,
    fecha_publicacion timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT donaciones_cantidad_ck CHECK ((cantidad > (0)::numeric)),
    CONSTRAINT donaciones_estado_ck CHECK (((estado)::text = ANY ((ARRAY['disponible'::character varying, 'reservado'::character varying, 'entregado'::character varying])::text[]))),
    CONSTRAINT donaciones_unidad_ck CHECK (((unidad)::text = ANY ((ARRAY['kg'::character varying, 'gramos'::character varying, 'unidades'::character varying, 'litros'::character varying, 'porciones'::character varying])::text[])))
);


--
-- Name: donaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.donaciones ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.donaciones_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: entregas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.entregas (
    id integer NOT NULL,
    solicitud_id integer NOT NULL,
    fecha_entrega date,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    observaciones text,
    CONSTRAINT entregas_estado_ck CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'en_camino'::character varying, 'entregada'::character varying, 'cancelada'::character varying])::text[])))
);


--
-- Name: entregas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.entregas ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.entregas_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: solicitudes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.solicitudes (
    id integer NOT NULL,
    donacion_id integer NOT NULL,
    organizacion_id integer NOT NULL,
    cantidad_solicitada numeric(10,2) NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    fecha_solicitud timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT solicitudes_cantidad_ck CHECK ((cantidad_solicitada > (0)::numeric)),
    CONSTRAINT solicitudes_estado_ck CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aceptada'::character varying, 'rechazada'::character varying, 'completada'::character varying])::text[])))
);


--
-- Name: solicitudes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.solicitudes ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.solicitudes_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    tipo_usuario character varying(20) NOT NULL,
    ubicacion character varying(150) NOT NULL,
    fecha_registro timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT usuarios_correo_ck CHECK (((correo)::text = lower((correo)::text))),
    CONSTRAINT usuarios_tipo_ck CHECK (((tipo_usuario)::text = ANY ((ARRAY['donante'::character varying, 'organizacion'::character varying])::text[])))
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

ALTER TABLE public.usuarios ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.usuarios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: donaciones; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (1, 1, 'Papa y yuca', 120.00, 'kg', '2026-10-28', 'Cra 13 # 63-20, Chapinero, Bogotá', 'Excedente de un proveedor mayorista.', 'reservado', '2026-10-13 20:36:17.945047+00');
INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (2, 1, 'Lentejas y frijol', 30.00, 'kg', '2027-01-14', 'Cra 13 # 63-20, Chapinero, Bogotá', 'Granos secos sobrantes de una compra por volumen.', 'disponible', '2026-10-14 20:36:17.945047+00');
INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (3, 1, 'Porciones de almuerzo congeladas', 40.00, 'porciones', '2026-11-15', 'Cra 13 # 63-20, Chapinero, Bogotá', 'Arroz, proteína y ensalada empacados individualmente.', 'disponible', '2026-10-16 17:36:17.945047+00');
INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (4, 2, 'Galletas y pasabocas', 150.00, 'unidades', '2026-11-30', 'Calle 38 Sur # 78-15, Kennedy, Bogotá', 'Paquetes individuales sin abrir.', 'disponible', '2026-10-12 20:36:17.945047+00');
INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (5, 2, 'Pan empacado variado', 60.00, 'unidades', '2026-10-26', 'Calle 38 Sur # 78-15, Kennedy, Bogotá', 'Pan de bono, pan francés y almojábanas empacadas.', 'disponible', '2026-10-16 15:36:17.945047+00');
INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (6, 3, 'Yogures y postres lácteos', 80.00, 'unidades', '2026-11-05', 'Av. Suba # 115-40, Suba, Bogotá', 'Refrigerados, con vencimiento próximo.', 'disponible', '2026-10-15 20:36:17.945047+00');
INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (7, 3, 'Arroz blanco', 50.00, 'kg', '2027-02-13', 'Av. Suba # 115-40, Suba, Bogotá', 'Bultos de 5 kg con empaque dañado y producto intacto.', 'entregado', '2026-10-07 20:36:17.945047+00');
INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (8, 3, 'Leche entera UHT', 120.00, 'litros', '2026-11-10', 'Av. Suba # 115-40, Suba, Bogotá', 'Cajas selladas con fecha de vencimiento cercana.', 'entregado', '2026-10-10 20:36:17.945047+00');
INSERT INTO public.donaciones (id, usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion) OVERRIDING SYSTEM VALUE VALUES (9, 3, 'Frutas y verduras frescas', 85.00, 'kg', '2026-10-26', 'Av. Suba # 115-40, Suba, Bogotá', 'Banano, tomate, zanahoria y cebolla en buen estado.', 'reservado', '2026-10-14 20:36:17.945047+00');


--
-- Data for Name: entregas; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.entregas (id, solicitud_id, fecha_entrega, estado, observaciones) OVERRIDING SYSTEM VALUE VALUES (1, 1, '2026-10-16', 'en_camino', 'Vehículo en ruta hacia Usme.');
INSERT INTO public.entregas (id, solicitud_id, fecha_entrega, estado, observaciones) OVERRIDING SYSTEM VALUE VALUES (2, 6, '2026-10-09', 'entregada', 'Entrega completa: 10 bultos de 5 kg.');
INSERT INTO public.entregas (id, solicitud_id, fecha_entrega, estado, observaciones) OVERRIDING SYSTEM VALUE VALUES (3, 7, '2026-10-12', 'entregada', 'Entregada en el comedor y firmada por la coordinadora.');
INSERT INTO public.entregas (id, solicitud_id, fecha_entrega, estado, observaciones) OVERRIDING SYSTEM VALUE VALUES (4, 8, NULL, 'pendiente', 'Recogida programada con el conductor de la fundación.');


--
-- Data for Name: solicitudes; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.solicitudes (id, donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud) OVERRIDING SYSTEM VALUE VALUES (1, 1, 6, 120.00, 'aceptada', '2026-10-14 20:36:17.945047+00');
INSERT INTO public.solicitudes (id, donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud) OVERRIDING SYSTEM VALUE VALUES (2, 3, 5, 30.00, 'pendiente', '2026-10-16 17:36:17.945047+00');
INSERT INTO public.solicitudes (id, donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud) OVERRIDING SYSTEM VALUE VALUES (3, 5, 6, 40.00, 'pendiente', '2026-10-16 18:36:17.945047+00');
INSERT INTO public.solicitudes (id, donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud) OVERRIDING SYSTEM VALUE VALUES (4, 5, 5, 30.00, 'pendiente', '2026-10-16 19:36:17.945047+00');
INSERT INTO public.solicitudes (id, donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud) OVERRIDING SYSTEM VALUE VALUES (5, 6, 4, 60.00, 'rechazada', '2026-10-15 20:36:17.945047+00');
INSERT INTO public.solicitudes (id, donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud) OVERRIDING SYSTEM VALUE VALUES (6, 7, 4, 50.00, 'completada', '2026-10-08 20:36:17.945047+00');
INSERT INTO public.solicitudes (id, donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud) OVERRIDING SYSTEM VALUE VALUES (7, 8, 5, 120.00, 'completada', '2026-10-11 20:36:17.945047+00');
INSERT INTO public.solicitudes (id, donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud) OVERRIDING SYSTEM VALUE VALUES (8, 9, 4, 85.00, 'aceptada', '2026-10-15 20:36:17.945047+00');


--
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: -
--

INSERT INTO public.usuarios (id, nombre, correo, password_hash, tipo_usuario, ubicacion, fecha_registro) OVERRIDING SYSTEM VALUE VALUES (1, 'Restaurante El Fogón', 'donante@cerohambre.com', 'scrypt$16384$8$1$krrna/ABBwxrCDgRi7q60g==$lYYLu59GI+ZqdajOa7xZBXkHumSLjCJKnJn+sGBRK9PqsBUHYRLVUk7dflnYTGZh5l6+0vMngdB9sHKq2KcVXA==', 'donante', 'Chapinero, Bogotá', '2026-10-16 20:36:17.945047+00');
INSERT INTO public.usuarios (id, nombre, correo, password_hash, tipo_usuario, ubicacion, fecha_registro) OVERRIDING SYSTEM VALUE VALUES (2, 'Panadería La Espiga', 'panaderia@cerohambre.com', 'scrypt$16384$8$1$P3RQPX5g9pSCtiRfJy9XLQ==$JLj+Wk6hnMsHF3fQhVkVeW5EAYKTwONpK22CmT+VQdgkRJ0Ke3S/6DI38Zqnz0eA0dmCqA9kyeXFnDTIlfvyYA==', 'donante', 'Kennedy, Bogotá', '2026-10-16 20:36:17.945047+00');
INSERT INTO public.usuarios (id, nombre, correo, password_hash, tipo_usuario, ubicacion, fecha_registro) OVERRIDING SYSTEM VALUE VALUES (3, 'Supermercado Buen Precio', 'supermercado@cerohambre.com', 'scrypt$16384$8$1$So+a20SL8C2Liusa7MmUgg==$QoL1TnIV2PrLKqUV5xjFTtiGEI+lrvsnZQM7CZaQ9JjpSYdO3TxpNxYXN77YddQCqIo1eZq71SQglIxv/+WLgg==', 'donante', 'Suba, Bogotá', '2026-10-16 20:36:17.945047+00');
INSERT INTO public.usuarios (id, nombre, correo, password_hash, tipo_usuario, ubicacion, fecha_registro) OVERRIDING SYSTEM VALUE VALUES (4, 'Fundación Manos Solidarias', 'organizacion@cerohambre.com', 'scrypt$16384$8$1$6gulDYChaC/Wgm5EtlvZ1w==$hIJQZHeGIKeTTuuvcWUDed34A0nYRQZEfNBlnOc5B/RvhvyQ4CO3i0mNp/CzpeKE77BHX9yP6xn577bb5qiUPw==', 'organizacion', 'Ciudad Bolívar, Bogotá', '2026-10-16 20:36:17.945047+00');
INSERT INTO public.usuarios (id, nombre, correo, password_hash, tipo_usuario, ubicacion, fecha_registro) OVERRIDING SYSTEM VALUE VALUES (5, 'Comedor Comunitario Esperanza', 'comedor@cerohambre.com', 'scrypt$16384$8$1$6fFw3+hYPguryTHvTHKEOg==$6wXplJt87g710vD3rUP4Kawakm6wrcnSk07Tb3HoQpz8FMICU6EeaNM01mRJJnrzPV0+6+ZT2clCBLe/zCpXCQ==', 'organizacion', 'Soacha, Cundinamarca', '2026-10-16 20:36:17.945047+00');
INSERT INTO public.usuarios (id, nombre, correo, password_hash, tipo_usuario, ubicacion, fecha_registro) OVERRIDING SYSTEM VALUE VALUES (6, 'Hogar Infantil Semillas', 'hogar@cerohambre.com', 'scrypt$16384$8$1$djz9KGsrlgE8KnsTQRzVew==$p4TK/vrc7YbmmyDOHl2LzxJaP6JQBNX4a1AHGYUfdJXe8VHByrUDAFT2UJbN1SYXiYYHq3epDKviWfYkLsJMmQ==', 'organizacion', 'Usme, Bogotá', '2026-10-16 20:36:17.945047+00');


--
-- Name: donaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.donaciones_id_seq', 9, true);


--
-- Name: entregas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.entregas_id_seq', 4, true);


--
-- Name: solicitudes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.solicitudes_id_seq', 8, true);


--
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 6, true);


--
-- Name: donaciones donaciones_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donaciones
    ADD CONSTRAINT donaciones_pk PRIMARY KEY (id);


--
-- Name: entregas entregas_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_pk PRIMARY KEY (id);


--
-- Name: entregas entregas_solicitud_uk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_solicitud_uk UNIQUE (solicitud_id);


--
-- Name: solicitudes solicitudes_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_pk PRIMARY KEY (id);


--
-- Name: usuarios usuarios_correo_uk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_uk UNIQUE (correo);


--
-- Name: usuarios usuarios_pk; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pk PRIMARY KEY (id);


--
-- Name: donaciones_estado_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX donaciones_estado_idx ON public.donaciones USING btree (estado);


--
-- Name: donaciones_usuario_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX donaciones_usuario_idx ON public.donaciones USING btree (usuario_id);


--
-- Name: solicitudes_activa_uk; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX solicitudes_activa_uk ON public.solicitudes USING btree (donacion_id, organizacion_id) WHERE ((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aceptada'::character varying])::text[]));


--
-- Name: solicitudes_donacion_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX solicitudes_donacion_idx ON public.solicitudes USING btree (donacion_id);


--
-- Name: solicitudes_organizacion_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX solicitudes_organizacion_idx ON public.solicitudes USING btree (organizacion_id);


--
-- Name: donaciones donaciones_usuario_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.donaciones
    ADD CONSTRAINT donaciones_usuario_fk FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: entregas entregas_solicitud_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.entregas
    ADD CONSTRAINT entregas_solicitud_fk FOREIGN KEY (solicitud_id) REFERENCES public.solicitudes(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitudes solicitudes_donacion_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_donacion_fk FOREIGN KEY (donacion_id) REFERENCES public.donaciones(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: solicitudes solicitudes_organizacion_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.solicitudes
    ADD CONSTRAINT solicitudes_organizacion_fk FOREIGN KEY (organizacion_id) REFERENCES public.usuarios(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- PostgreSQL database dump complete
--


