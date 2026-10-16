-- =====================================================================
--  CeroHambre · Datos de ejemplo
--
--  Se ejecuta automáticamente al crear una base vacía (ver Backend/Config/initDb.js)
--  o a mano con:  psql "$DATABASE_URL" -f database/seed.sql
--
--  CREDENCIALES DE PRUEBA
--    Donante       donante@cerohambre.com        Donante123*
--    Organización  organizacion@cerohambre.com   Organizacion123*
--  (los demás donantes usan la clave Donante123* y las demás
--   organizaciones la clave Organizacion123*)
--
--  Las contraseñas se guardan con hash scrypt, nunca en texto plano.
--  Las fechas son relativas a "hoy" para que los datos no queden vencidos.
-- =====================================================================

-- ---------------------------------------------------------------------
--  USUARIOS
-- ---------------------------------------------------------------------
INSERT INTO usuarios (nombre, correo, password_hash, tipo_usuario, ubicacion) VALUES
    ('Restaurante El Fogón',          'donante@cerohambre.com',      'scrypt$16384$8$1$krrna/ABBwxrCDgRi7q60g==$lYYLu59GI+ZqdajOa7xZBXkHumSLjCJKnJn+sGBRK9PqsBUHYRLVUk7dflnYTGZh5l6+0vMngdB9sHKq2KcVXA==',      'donante',      'Chapinero, Bogotá'),
    ('Panadería La Espiga',           'panaderia@cerohambre.com',    'scrypt$16384$8$1$P3RQPX5g9pSCtiRfJy9XLQ==$JLj+Wk6hnMsHF3fQhVkVeW5EAYKTwONpK22CmT+VQdgkRJ0Ke3S/6DI38Zqnz0eA0dmCqA9kyeXFnDTIlfvyYA==',    'donante',      'Kennedy, Bogotá'),
    ('Supermercado Buen Precio',      'supermercado@cerohambre.com', 'scrypt$16384$8$1$So+a20SL8C2Liusa7MmUgg==$QoL1TnIV2PrLKqUV5xjFTtiGEI+lrvsnZQM7CZaQ9JjpSYdO3TxpNxYXN77YddQCqIo1eZq71SQglIxv/+WLgg==', 'donante',      'Suba, Bogotá'),
    ('Fundación Manos Solidarias',    'organizacion@cerohambre.com', 'scrypt$16384$8$1$6gulDYChaC/Wgm5EtlvZ1w==$hIJQZHeGIKeTTuuvcWUDed34A0nYRQZEfNBlnOc5B/RvhvyQ4CO3i0mNp/CzpeKE77BHX9yP6xn577bb5qiUPw==', 'organizacion', 'Ciudad Bolívar, Bogotá'),
    ('Comedor Comunitario Esperanza', 'comedor@cerohambre.com',      'scrypt$16384$8$1$6fFw3+hYPguryTHvTHKEOg==$6wXplJt87g710vD3rUP4Kawakm6wrcnSk07Tb3HoQpz8FMICU6EeaNM01mRJJnrzPV0+6+ZT2clCBLe/zCpXCQ==',      'organizacion', 'Soacha, Cundinamarca'),
    ('Hogar Infantil Semillas',       'hogar@cerohambre.com',        'scrypt$16384$8$1$djz9KGsrlgE8KnsTQRzVew==$p4TK/vrc7YbmmyDOHl2LzxJaP6JQBNX4a1AHGYUfdJXe8VHByrUDAFT2UJbN1SYXiYYHq3epDKviWfYkLsJMmQ==',        'organizacion', 'Usme, Bogotá');

-- ---------------------------------------------------------------------
--  DONACIONES
-- ---------------------------------------------------------------------
INSERT INTO donaciones
    (usuario_id, alimento, cantidad, unidad, fecha_vencimiento, ubicacion, descripcion, estado, fecha_publicacion)
SELECT u.id, v.alimento, v.cantidad, v.unidad, CURRENT_DATE + v.dias, v.ubicacion, v.descripcion, v.estado, NOW() - v.hace
FROM (VALUES
    ('donante@cerohambre.com',      'Porciones de almuerzo congeladas', 40,  'porciones', 30, 'Cra 13 # 63-20, Chapinero, Bogotá',  'Arroz, proteína y ensalada empacados individualmente.',         'disponible', INTERVAL '3 hours'),
    ('panaderia@cerohambre.com',    'Pan empacado variado',             60,  'unidades',  10, 'Calle 38 Sur # 78-15, Kennedy, Bogotá', 'Pan de bono, pan francés y almojábanas empacadas.',          'disponible', INTERVAL '5 hours'),
    ('supermercado@cerohambre.com', 'Frutas y verduras frescas',        85,  'kg',        10, 'Av. Suba # 115-40, Suba, Bogotá',    'Banano, tomate, zanahoria y cebolla en buen estado.',          'reservado',  INTERVAL '2 days'),
    ('supermercado@cerohambre.com', 'Leche entera UHT',                 120, 'litros',    25, 'Av. Suba # 115-40, Suba, Bogotá',    'Cajas selladas con fecha de vencimiento cercana.',             'entregado',  INTERVAL '6 days'),
    ('supermercado@cerohambre.com', 'Arroz blanco',                     50,  'kg',       120, 'Av. Suba # 115-40, Suba, Bogotá',    'Bultos de 5 kg con empaque dañado y producto intacto.',        'entregado',  INTERVAL '9 days'),
    ('supermercado@cerohambre.com', 'Yogures y postres lácteos',        80,  'unidades',  20, 'Av. Suba # 115-40, Suba, Bogotá',    'Refrigerados, con vencimiento próximo.',                        'disponible', INTERVAL '1 day'),
    ('donante@cerohambre.com',      'Lentejas y frijol',                30,  'kg',        90, 'Cra 13 # 63-20, Chapinero, Bogotá',  'Granos secos sobrantes de una compra por volumen.',             'disponible', INTERVAL '2 days'),
    ('donante@cerohambre.com',      'Papa y yuca',                      120, 'kg',        12, 'Cra 13 # 63-20, Chapinero, Bogotá',  'Excedente de un proveedor mayorista.',                          'reservado',  INTERVAL '3 days'),
    ('panaderia@cerohambre.com',    'Galletas y pasabocas',             150, 'unidades',  45, 'Calle 38 Sur # 78-15, Kennedy, Bogotá', 'Paquetes individuales sin abrir.',                            'disponible', INTERVAL '4 days')
) AS v(correo, alimento, cantidad, unidad, dias, ubicacion, descripcion, estado, hace)
INNER JOIN usuarios u ON u.correo = v.correo;

-- ---------------------------------------------------------------------
--  SOLICITUDES
-- ---------------------------------------------------------------------
INSERT INTO solicitudes (donacion_id, organizacion_id, cantidad_solicitada, estado, fecha_solicitud)
SELECT d.id, o.id, v.cantidad, v.estado, NOW() - v.hace
FROM (VALUES
    ('Frutas y verduras frescas',        'organizacion@cerohambre.com', 85,  'aceptada',   INTERVAL '1 day'),
    ('Leche entera UHT',                 'comedor@cerohambre.com',      120, 'completada', INTERVAL '5 days'),
    ('Arroz blanco',                     'organizacion@cerohambre.com', 50,  'completada', INTERVAL '8 days'),
    ('Papa y yuca',                      'hogar@cerohambre.com',        120, 'aceptada',   INTERVAL '2 days'),
    ('Porciones de almuerzo congeladas', 'comedor@cerohambre.com',      30,  'pendiente',  INTERVAL '3 hours'),
    ('Pan empacado variado',             'hogar@cerohambre.com',        40,  'pendiente',  INTERVAL '2 hours'),
    ('Pan empacado variado',             'comedor@cerohambre.com',      30,  'pendiente',  INTERVAL '1 hour'),
    ('Yogures y postres lácteos',        'organizacion@cerohambre.com', 60,  'rechazada',  INTERVAL '1 day')
) AS v(alimento, correo, cantidad, estado, hace)
INNER JOIN donaciones d ON d.alimento = v.alimento
INNER JOIN usuarios o ON o.correo = v.correo;

-- ---------------------------------------------------------------------
--  ENTREGAS
-- ---------------------------------------------------------------------
INSERT INTO entregas (solicitud_id, fecha_entrega, estado, observaciones)
SELECT s.id, CURRENT_DATE + v.dias, v.estado, v.observaciones
FROM (VALUES
    ('Frutas y verduras frescas', NULL::int, 'pendiente', 'Recogida programada con el conductor de la fundación.'),
    ('Leche entera UHT',          -4,        'entregada', 'Entregada en el comedor y firmada por la coordinadora.'),
    ('Arroz blanco',              -7,        'entregada', 'Entrega completa: 10 bultos de 5 kg.'),
    ('Papa y yuca',               0,         'en_camino', 'Vehículo en ruta hacia Usme.')
) AS v(alimento, dias, estado, observaciones)
INNER JOIN donaciones d ON d.alimento = v.alimento
INNER JOIN solicitudes s ON s.donacion_id = d.id AND s.estado IN ('aceptada', 'completada');
