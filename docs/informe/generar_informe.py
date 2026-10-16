#!/usr/bin/env python3
"""
Genera el informe PDF del Momento 2 (CeroHambre).

Uso (desde la raíz del repositorio):
    python3 docs/informe/generar_informe.py [docs/informe/config.json]

Edita config.json (integrantes, docente, URL del repositorio, URL de Render...)
y vuelve a ejecutar el script: el PDF se regenera con los datos nuevos.

Requisitos: pip install playwright pypdf reportlab pillow && playwright install chromium
Salida:     docs/Informe_Momento_2_CeroHambre.pdf
"""
import html
import io
import json
import re
import sys
import unicodedata
from pathlib import Path

from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.lib.colors import HexColor
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from playwright.sync_api import sync_playwright

AQUI = Path(__file__).resolve().parent
RAIZ = AQUI.parent.parent
CAPTURAS = RAIZ / "docs" / "capturas"
BUILD = AQUI / "_build"
SALIDA = RAIZ / "docs" / "Informe_Momento_2_CeroHambre.pdf"

CONFIG_RUTA = Path(sys.argv[1]) if len(sys.argv) > 1 else AQUI / "config.json"
CFG = json.loads(CONFIG_RUTA.read_text(encoding="utf-8"))


# ----------------------------------------------------------------------
#  Utilidades
# ----------------------------------------------------------------------
def esc(texto):
    return html.escape(str(texto), quote=True)


def dato(valor):
    """Texto de la configuración; si es un [marcador] se resalta para que se note."""
    v = str(valor)
    if v.startswith("[") and v.endswith("]"):
        return f'<span class="pendiente">{esc(v)}</span>'
    return esc(v)


def enlace(valor):
    v = str(valor)
    if v.startswith("[") and v.endswith("]"):
        return dato(v)
    return f'<a href="{esc(v)}">{esc(v)}</a>'


def normalizar(texto):
    t = unicodedata.normalize("NFKD", texto)
    t = "".join(c for c in t if not unicodedata.combining(c))
    return re.sub(r"\s+", "", t).lower()


# ----------------------------------------------------------------------
#  Imágenes (se recortan para quitar el pie de página del sitio)
# ----------------------------------------------------------------------
def preparar(nombre, max_alto=None, caja=None, origen=CAPTURAS):
    BUILD.mkdir(exist_ok=True)
    im = Image.open(origen / nombre).convert("RGB")
    ancho, alto = im.size
    if caja:
        im = im.crop(caja)
    else:
        # quitar el pie oscuro del sitio (si existe)
        y = alto
        while y > 0 and sum(im.getpixel((8, y - 1))) < 200:
            y -= 1
        if y < alto:
            im = im.crop((0, 0, ancho, y))
        if max_alto and im.size[1] > max_alto:
            im = im.crop((0, 0, im.size[0], max_alto))
    destino = BUILD / nombre
    im.save(destino, optimize=True)
    return destino.as_uri()


# ----------------------------------------------------------------------
#  Estructura del documento
# ----------------------------------------------------------------------
ENCABEZADOS = []          # (nivel, texto)
CONTADOR_FIG = [0]


def h1(texto):
    ENCABEZADOS.append((1, texto))
    return f'<h1>{esc(texto)}</h1>'


def h2(texto):
    ENCABEZADOS.append((2, texto))
    return f'<h2>{esc(texto)}</h2>'


def bloque(*partes):
    """Agrupa título, texto y figura para que no se separen entre páginas."""
    return '<div class="bloque">' + "".join(partes) + "</div>"


def fig(imagenes, pie, ancho="100%"):
    """imagenes: lista de URIs. Si hay varias, se muestran lado a lado."""
    CONTADOR_FIG[0] += 1
    n = CONTADOR_FIG[0]
    ancho_img = "100%" if len(imagenes) == 1 else f"{int(98 / len(imagenes))}%"
    celdas = "".join(f'<img src="{u}" style="width:{ancho_img}">' for u in imagenes)
    return (
        f'<figure style="width:{ancho}"><div class="fila-img">{celdas}</div>'
        f'<figcaption><b>Figura {n}.</b> {pie}</figcaption></figure>'
    )


def tabla(cabeceras, filas, anchos=None, corta=False):
    cols = ""
    if anchos:
        cols = "<colgroup>" + "".join(f'<col style="width:{a}">' for a in anchos) + "</colgroup>"
    th = "".join(f"<th>{c}</th>" for c in cabeceras)
    trs = "".join("<tr>" + "".join(f"<td>{c}</td>" for c in fila) + "</tr>" for fila in filas)
    clase = ' class="corta"' if corta else ""
    return f"<table{clase}>{cols}<thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table>"


def ajustar_lineas(texto, ancho=92, sangria=40):
    """Parte las líneas largas de código en el último espacio disponible."""
    salida = []
    for linea in texto.split("\n"):
        while len(linea) > ancho:
            corte = linea.rfind(" ", 0, ancho)
            if corte <= sangria:
                break
            salida.append(linea[:corte])
            linea = " " * sangria + linea[corte + 1:].lstrip()
        salida.append(linea)
    return "\n".join(salida)


def codigo(texto):
    return f'<pre>{esc(ajustar_lineas(texto.strip(chr(10))))}</pre>'


def bloque_sql(nombre_tabla):
    sql = (RAIZ / "database" / "schema.sql").read_text(encoding="utf-8")
    ini = sql.index(f"CREATE TABLE IF NOT EXISTS {nombre_tabla} (")
    fin = sql.index("\n);", ini) + 3
    return sql[ini:fin]


def bloque_indice():
    sql = (RAIZ / "database" / "schema.sql").read_text(encoding="utf-8")
    ini = sql.index("CREATE UNIQUE INDEX IF NOT EXISTS solicitudes_activa_uk")
    fin = sql.index(";", ini) + 1
    return sql[ini:fin]


# ----------------------------------------------------------------------
#  Contenido
# ----------------------------------------------------------------------
def contenido():
    c = []
    A = c.append

    # ============ 1. ENLACES ============
    A(h1("1. Enlaces de acceso y credenciales de prueba"))
    A("<p>Este informe acompaña la entrega del Momento 2. A continuación se relacionan el código fuente, "
      "la aplicación publicada y las credenciales para probar cada rol del sistema.</p>")
    A(tabla(
        ["Elemento", "Información"],
        [
            ["Repositorio en GitHub", enlace(CFG["url_repo"])],
            ["Acceso del docente al repositorio", dato(CFG["acceso_docente"])],
            ["Aplicación desplegada (Render)", enlace(CFG["url_app"])],
            ["Base de datos en el repositorio",
             "Carpeta <code>/database</code>: <code>schema.sql</code>, <code>seed.sql</code>, "
             "<code>cerohambre_backup.sql</code> y <code>DER.png</code>"],
        ],
        ["32%", "68%"], corta=True,
    ))
    A("<h3>Usuarios de prueba</h3>")
    A(tabla(
        ["Rol", "Correo", "Contraseña", "Qué se puede probar"],
        [[esc(u["rol"]), f'<code>{esc(u["correo"])}</code>', f'<code>{esc(u["clave"])}</code>', esc(u["prueba"])]
         for u in CFG["usuarios_prueba"]],
        ["15%", "29%", "20%", "36%"], corta=True,
    ))
    A("<p>Las secciones <i>Inicio</i> y <i>Reportes</i> son públicas; el resto de las vistas exige iniciar "
      "sesión. También es posible crear cuentas nuevas desde la vista de registro.</p>")
    A('<p class="nota"><b>Nota sobre el servicio gratuito de Render:</b> si la aplicación lleva unos minutos sin '
      "recibir visitas, la primera carga puede tardar cerca de un minuto mientras el servicio se reactiva.</p>")

    # ============ 2. DESCRIPCIÓN Y ODS ============
    A(h1("2. Descripción de la solución y contribución al ODS 2"))
    A(h2("2.1 Problema que se atiende"))
    A("<p>Restaurantes, panaderías, supermercados y productores generan con frecuencia excedentes de alimentos "
      "en buen estado que terminan desperdiciados, mientras que fundaciones, comedores comunitarios y hogares "
      "infantiles necesitan esos alimentos y no cuentan con un canal ágil para saber qué hay disponible, en qué "
      "cantidad, dónde recogerlo y hasta cuándo es aprovechable. La falta de información oportuna y de "
      "coordinación hace que el alimento se venza antes de llegar a quien lo necesita.</p>")
    A(h2("2.2 Solución propuesta"))
    A("<p><b>CeroHambre</b> es una aplicación web que conecta a los <b>donantes</b> de alimentos con las "
      "<b>organizaciones</b> que atienden a población vulnerable. El donante publica los alimentos disponibles "
      "(tipo, cantidad, unidad, fecha de vencimiento y lugar de recogida); la organización consulta la oferta y "
      "solicita la cantidad que necesita; el donante acepta o rechaza la solicitud y registra la entrega; y el "
      "sistema deja trazabilidad de cada paso y la resume en reportes de impacto.</p>")
    A("<p>La aplicación controla las reglas que evitan errores en la operación: no se puede solicitar más de lo "
      "disponible, no se pueden pedir alimentos vencidos o ya reservados y no se pueden duplicar solicitudes "
      "activas sobre la misma donación.</p>")
    A(h2("2.3 Contribución al ODS 2 – Hambre Cero"))
    A("<p>El Objetivo de Desarrollo Sostenible 2 busca poner fin al hambre, lograr la seguridad alimentaria y "
      "mejorar la nutrición. CeroHambre contribuye de manera directa a la <b>meta 2.1</b> (acceso de las personas "
      "en situación de vulnerabilidad a una alimentación suficiente y nutritiva) y de forma complementaria a la "
      "<b>meta 12.3</b> (reducir el desperdicio y las pérdidas de alimentos). Lo hace de cuatro maneras:</p>")
    A("<ul>"
      "<li><b>Acceso:</b> los alimentos excedentes llegan a organizaciones que los distribuyen a personas que los necesitan.</li>"
      "<li><b>Reducción del desperdicio:</b> la fecha de vencimiento y el estado de cada donación permiten "
      "priorizar y aprovechar los alimentos antes de que se pierdan.</li>"
      "<li><b>Coordinación y trazabilidad:</b> cada alimento pasa por estados verificables "
      "(disponible, reservado, entregado) y cada entrega por su propio seguimiento.</li>"
      "<li><b>Medición:</b> la vista de reportes calcula los alimentos recuperados, las entregas realizadas y las "
      "organizaciones atendidas a partir de los registros del sistema.</li></ul>")
    A("<p>CeroHambre es una herramienta de articulación: no reemplaza la logística de las organizaciones ni mide "
      "por sí sola cuántas personas son atendidas. Las cifras de los reportes dependen de los datos que registran "
      "los usuarios; los valores que aparecen en las capturas de este informe corresponden a los datos de ejemplo "
      "incluidos en el proyecto.</p>")
    A(h2("2.4 Usuarios y roles"))
    A(tabla(
        ["Rol", "Quién es", "Qué puede hacer"],
        [
            ["Donante", "Restaurantes, panaderías, supermercados, productores.",
             "Publicar, editar y eliminar sus donaciones; aceptar o rechazar solicitudes; registrar la entrega y "
             "cambiar su estado (pendiente, en camino, entregada, cancelada)."],
            ["Organización", "Fundaciones, comedores comunitarios, hogares infantiles.",
             "Consultar alimentos disponibles; solicitar una cantidad; ver el estado de sus solicitudes y entregas."],
            ["Visitante", "Cualquier persona.", "Ver la página de inicio, las donaciones disponibles y los reportes públicos."],
        ],
        ["18%", "34%", "48%"], corta=True,
    ))

    # ============ 3. ARQUITECTURA ============
    A(h1("3. Funcionamiento y arquitectura"))
    A(h2("3.1 Arquitectura de tres capas"))
    A('<div class="arq">'
      '<div class="caja"><b>Navegador</b><br>HTML, CSS y JavaScript<br><span>Interfaz y validación en cliente</span></div>'
      '<div class="flecha">⇄<br><span>HTTPS<br>JSON</span></div>'
      '<div class="caja"><b>API REST</b><br>Node.js + Express<br><span>Reglas de negocio, autenticación, permisos</span></div>'
      '<div class="flecha">⇄<br><span>SQL<br>(pg)</span></div>'
      '<div class="caja"><b>Base de datos</b><br>PostgreSQL<br><span>Datos, integridad y restricciones</span></div>'
      '</div>')
    A("<p>El mismo servidor Express entrega los archivos del frontend y la API (<code>/api/...</code>), de modo "
      "que la aplicación completa se publica como un único servicio web en Render y se conecta a una base de "
      "datos PostgreSQL administrada. Las credenciales se leen de variables de entorno.</p>")
    A(h2("3.2 Flujo principal"))
    A('<div class="flujo">'
      '<div class="paso"><b>1</b> El donante publica la donación<br><span>estado: disponible</span></div>'
      '<div class="paso"><b>2</b> La organización la solicita<br><span>solicitud: pendiente</span></div>'
      '<div class="paso"><b>3</b> El donante acepta<br><span>solicitud: aceptada · donación: reservado</span></div>'
      '<div class="paso"><b>4</b> Se registra y envía la entrega<br><span>entrega: pendiente → en camino</span></div>'
      '<div class="paso"><b>5</b> Se confirma la entrega<br><span>entrega: entregada · solicitud: completada · donación: entregado</span></div>'
      '</div>')
    A(h2("3.3 Estados y reglas de negocio"))
    A(tabla(
        ["Entidad", "Estados", "Reglas principales"],
        [
            ["Donación", "disponible, reservado, entregado",
             "Una donación disponible cuya fecha de vencimiento ya pasó se muestra como vencida y no puede solicitarse."],
            ["Solicitud", "pendiente, aceptada, rechazada, completada",
             "La cantidad pedida no puede superar la disponible. Al aceptar una solicitud, la donación queda "
             "reservada y las demás solicitudes pendientes se rechazan."],
            ["Entrega", "pendiente, en camino, entregada, cancelada",
             "Solo existe una entrega por solicitud. Al entregar, la solicitud se completa y la donación pasa a "
             "entregada; si se cancela, la donación vuelve a estar disponible."],
        ],
        ["16%", "30%", "54%"], corta=True,
    ))
    A(h2("3.4 Estructura del repositorio"))
    A(codigo("""
Backend/        API REST: Server.js, Config/, Routes/, controllers/,
                middleware/, utils/, scripts/ y tests/
Frontend/       Interfaz: páginas HTML, Css/Styles.css y Js/App.js
database/       schema.sql, seed.sql, cerohambre_backup.sql, DER.png/svg
docs/           Capturas del sistema e informe
.env.example    Variables de entorno necesarias (sin valores reales)
render.yaml     Despliegue automático en Render (Blueprint)
README.md       Instalación, ejecución, despliegue y API
"""))
    A(h2("3.5 Principales servicios de la API"))
    A(tabla(
        ["Método y ruta", "Función", "Acceso"],
        [
            ["POST /api/usuarios", "Registrar usuario", "Público"],
            ["POST /api/usuarios/login", "Iniciar sesión (entrega el token)", "Público"],
            ["GET /api/donaciones", "Listar donaciones", "Público"],
            ["POST /api/donaciones", "Publicar una donación", "Donante"],
            ["POST /api/solicitudes", "Solicitar una donación", "Organización"],
            ["PUT /api/solicitudes/:id", "Aceptar o rechazar una solicitud", "Donante"],
            ["POST /api/entregas · PUT /api/entregas/:id", "Registrar y actualizar una entrega", "Donante"],
            ["GET /api/reportes", "Indicadores de impacto", "Público"],
            ["GET /api/salud", "Estado del servidor y de la base de datos", "Público"],
        ],
        ["44%", "38%", "18%"], corta=True,
    ))

    # ============ 4. CAPTURAS ============
    A(h1("4. Capturas de pantalla de las vistas principales"))
    A("<p>Las capturas muestran la aplicación en funcionamiento con los datos de ejemplo del proyecto "
      "(<code>database/seed.sql</code>). Se recorre el flujo completo: registro e ingreso, publicación de una donación, "
      "solicitud por parte de una organización, aceptación, entrega y reportes.</p>")

    A(bloque(
        h2("4.1 Página de inicio"),
        "<p>La página de inicio presenta el propósito del proyecto, explica el funcionamiento en cuatro pasos y "
        "muestra las cifras de impacto leídas de la base de datos. Desde allí se accede al registro y al inicio de sesión.</p>",
        fig([preparar("01-inicio.png", 1250)], "Página de inicio de CeroHambre.", "92%"),
    ))

    A(bloque(
        h2("4.2 Registro e inicio de sesión"),
        "<p>En el registro cada usuario elige su tipo (donante u organización), indica su ubicación y define una "
        "contraseña de al menos 8 caracteres. El inicio de sesión valida las credenciales en el servidor y muestra un "
        "mensaje cuando son incorrectas.</p>",
        fig([preparar("02-registro.png", None, (330, 0, 1036, 961)), preparar("03-login.png", None, (330, 0, 1036, 850))],
            "Registro de usuarios (izquierda) e inicio de sesión (derecha)."),
    ))

    A(bloque(
        h2("4.3 Panel principal"),
        "<p>Tras iniciar sesión, el usuario llega a su panel: contadores de donaciones, solicitudes, entregas y "
        "alimentos recuperados, accesos rápidos a las funciones principales y actividad reciente. El menú y los "
        "botones se adaptan al rol: solo el donante ve las opciones de publicar donaciones y gestionar entregas.</p>",
        fig([preparar("04-dashboard-donante.png", 1470)], "Panel principal de un usuario donante.", "98%"),
    ))

    A(bloque(
        h2("4.4 Donaciones disponibles"),
        "<p>La vista de donaciones lista los alimentos con su cantidad, ubicación, fecha de vencimiento, donante y "
        "estado (disponible, reservado o entregado). Las organizaciones pueden solicitar desde cada tarjeta.</p>",
        fig([preparar("05-donaciones.png", 1160)], "Listado de donaciones.", "100%"),
    ))

    A(bloque(
        h2("4.5 Publicación de una donación"),
        "<p>El donante publica nuevas donaciones con un formulario que valida los campos obligatorios, que la cantidad "
        "sea positiva y que la fecha de vencimiento no sea pasada; el servidor repite estas validaciones.</p>",
        fig([preparar("06-publicar-donacion.png", 1085)], "Formulario para publicar una donación.", "100%"),
    ))

    A(bloque(
        h2("4.6 Solicitudes"),
        "<p>La organización solicita una cantidad desde la tarjeta de la donación; el sistema valida que no supere lo "
        "disponible y muestra el error en la misma ventana. El donante ve las solicitudes recibidas y puede aceptarlas "
        "o rechazarlas; al aceptar, la donación queda reservada.</p>",
        fig([preparar("08b-error-cantidad.png", None, (443, 205, 923, 645)),
             preparar("08-solicitud-aceptada.png", None, (443, 205, 923, 645))],
            "Validación de la cantidad solicitada (izquierda) y confirmación al aceptar una solicitud (derecha).", "90%"),
        fig([preparar("07-solicitudes-donante.png", 900)],
            "Solicitudes recibidas por el donante, con las acciones Aceptar y Rechazar.", "84%"),
    ))

    A(bloque(
        h2("4.7 Entregas"),
        "<p>Una solicitud aceptada permite registrar la entrega. El donante la marca como en camino y, al confirmarse, "
        "como entregada; en ese momento la solicitud pasa a completada y la donación a entregada.</p>",
        fig([preparar("09b-entregas-despues.png", 960)], "Seguimiento de entregas: una entregada y otra en camino.", "100%"),
    ))

    A(bloque(
        h2("4.8 Reportes"),
        "<p>Los reportes calculan, a partir de la base de datos, los alimentos recuperados (kilogramos), las "
        "organizaciones atendidas, las entregas realizadas y las organizaciones beneficiadas, además del total "
        "recuperado por unidad de medida y el número de donaciones por estado.</p>",
        fig([preparar("10b-reportes-despues.png", 1230)], "Reportes de impacto de CeroHambre.", "100%"),
    ))

    # ============ 5. BASE DE DATOS ============
    A(h1("5. Base de datos"))
    A(h2("5.1 Motor de base de datos"))
    A("<p>Se utiliza <b>PostgreSQL</b>, un motor relacional de código abierto con soporte completo de "
      "transacciones, llaves foráneas y restricciones de integridad. En producción se emplea el servicio "
      "PostgreSQL administrado de Render, al que la aplicación se conecta mediante la variable de entorno "
      "<code>DATABASE_URL</code>; en desarrollo y pruebas se usó PostgreSQL 16 local. La base es propia y "
      "persistente (no depende de servicios como Supabase o Neon).</p>")
    A(h2("5.2 Modelo relacional"))
    A(tabla(
        ["Tabla", "Propósito", "Llave primaria", "Llaves foráneas"],
        [
            ["usuarios", "Donantes y organizaciones registradas", "id", "—"],
            ["donaciones", "Alimentos que publica un donante", "id", "usuario_id → usuarios"],
            ["solicitudes", "Peticiones de una organización sobre una donación", "id",
             "donacion_id → donaciones<br>organizacion_id → usuarios"],
            ["entregas", "Seguimiento logístico de una solicitud aceptada", "id", "solicitud_id → solicitudes (único)"],
        ],
        ["16%", "36%", "14%", "34%"], corta=True,
    ))
    A(bloque(
        h2("5.3 Fragmento del esquema"),
        "<p>Fragmento del archivo <code>database/schema.sql</code>: tabla <code>usuarios</code>, tabla "
        "<code>solicitudes</code> y el índice único parcial que impide solicitudes activas duplicadas.</p>",
        codigo(bloque_sql("usuarios")),
        codigo(bloque_sql("solicitudes") + "\n\n" + bloque_indice()),
    ))
    A(h2("5.4 Diagrama entidad-relación"))
    A(fig([(RAIZ / "database" / "DER.png").as_uri()],
          "Diagrama entidad-relación de CeroHambre, generado a partir de la base de datos real "
          "(<code>database/DER.png</code>, alta resolución).", "82%"))
    A(h2("5.5 Cardinalidades"))
    A(tabla(
        ["Relación", "Cardinalidad", "Descripción"],
        [
            ["usuarios (donante) – donaciones", "1 : N", "Un donante publica muchas donaciones; cada donación pertenece a un donante."],
            ["donaciones – solicitudes", "1 : N", "Una donación puede recibir varias solicitudes; cada solicitud es sobre una donación."],
            ["usuarios (organización) – solicitudes", "1 : N", "Una organización realiza muchas solicitudes."],
            ["solicitudes – entregas", "1 : 0..1", "Una solicitud aceptada genera como máximo una entrega."],
        ],
        ["38%", "14%", "48%"], corta=True,
    ))
    A(h2("5.6 Normalización (3FN)"))
    A("<p>El modelo cumple la <b>Tercera Forma Normal</b>: (1) todos los atributos son atómicos y cada tabla tiene "
      "una llave primaria simple; (2) no existen dependencias parciales, porque las llaves son de una sola columna; "
      "y (3) no existen dependencias transitivas, porque los datos de cada entidad se guardan una sola vez y se "
      "referencian por llave foránea: los datos del donante y de la organización viven solo en <code>usuarios</code>, "
      "los del alimento en <code>donaciones</code>, la cantidad pedida en <code>solicitudes</code> y el seguimiento "
      "en <code>entregas</code>. Valores derivados, como el hecho de que una donación esté vencida, no se almacenan: "
      "se calculan al consultar.</p>")
    A(h2("5.7 Integridad de los datos"))
    A("<ul>"
      "<li><b>Llaves foráneas con <code>ON DELETE RESTRICT</code>:</b> no se puede borrar un registro que tiene información relacionada.</li>"
      "<li><b>Restricciones <code>CHECK</code>:</b> cantidades mayores que cero; unidades, estados y tipos de usuario dentro de listas cerradas; correo en minúsculas.</li>"
      "<li><b>Restricciones <code>UNIQUE</code>:</b> un correo por usuario y una entrega por solicitud.</li>"
      "<li><b>Índice único parcial:</b> una organización no puede tener dos solicitudes activas (pendiente o aceptada) sobre la misma donación.</li>"
      "<li><b>Transacciones:</b> las operaciones de varios pasos (aceptar una solicitud, registrar o cerrar una entrega) se ejecutan en una transacción, con bloqueo de fila para evitar condiciones de carrera.</li>"
      "</ul>")
    A(h2("5.8 Archivos entregados en /database"))
    A(tabla(
        ["Archivo", "Contenido"],
        [
            ["<code>schema.sql</code>", "Esquema completo: tablas, llaves, restricciones e índices."],
            ["<code>seed.sql</code>", "Datos de ejemplo (6 usuarios, 9 donaciones, 8 solicitudes y 4 entregas)."],
            ["<code>cerohambre_backup.sql</code>", "Volcado (<i>dump</i>) de la base con esquema y datos, listo para restaurar con <code>psql</code>."],
            ["<code>DER.png</code> / <code>DER.svg</code>", "Diagrama entidad-relación en alta resolución."],
        ],
        ["38%", "62%"], corta=True,
    ))

    # ============ 6. TECNOLOGÍAS ============
    A(h1("6. Tecnologías y justificación de los cambios"))
    A(h2("6.1 Tecnologías utilizadas"))
    A(tabla(
        ["Capa", "Tecnología", "Justificación"],
        [
            ["Frontend", "HTML5, CSS3 y JavaScript",
             "Sin pasos de compilación ni dependencias: el servidor entrega los archivos tal cual y la interfaz es fácil de mantener."],
            ["Backend", "Node.js y Express 5",
             "Mismo lenguaje en cliente y servidor, ecosistema amplio y despliegue sencillo en Render."],
            ["Base de datos", "PostgreSQL y el controlador <code>pg</code>",
             "Motor relacional robusto, con integridad referencial, transacciones y servicio administrado en Render. Consultas parametrizadas y <i>pool</i> de conexiones."],
            ["Contraseñas", "Hash <code>scrypt</code> (módulo <code>crypto</code> de Node)",
             "Las contraseñas no se guardan en texto plano; <code>scrypt</code> es lento por diseño y resiste ataques de fuerza bruta."],
            ["Sesiones", "Token firmado (JWT, HS256)",
             "Permite autenticar cada petición sin guardar sesiones en el servidor y aplicar permisos por rol."],
            ["Despliegue", "Render (servicio web + PostgreSQL) y <code>render.yaml</code>",
             "Plataforma exigida por la actividad; el archivo Blueprint crea ambos servicios ya conectados."],
            ["Control de versiones", "Git y GitHub", "Historial de cambios y despliegue automático a partir del repositorio."],
        ],
        ["16%", "28%", "56%"],
    ))
    A(h2("6.2 Cambios respecto al Momento 1"))
    A("<p>Para pasar del prototipo inicial a una aplicación completa, segura y desplegable se realizaron los "
      "siguientes cambios, cada uno con su justificación:</p>")
    A(tabla(
        ["Cambio", "Justificación"],
        [
            ["Base de datos: de MySQL a PostgreSQL",
             "Render ofrece PostgreSQL administrado (no MySQL) y la actividad exige un motor propio y persistente. El esquema se rediseñó con llaves foráneas, restricciones e índices."],
            ["Configuración por variables de entorno (<code>.env</code> y <code>.env.example</code>)",
             "Las credenciales no deben estar en el código ni en GitHub; en Render se configuran como variables del servicio."],
            ["Contraseñas con hash <code>scrypt</code>",
             "Antes se guardaban y comparaban en texto plano, lo que es inseguro."],
            ["Autenticación con token y permisos por rol en el servidor",
             "Antes bastaba con enviar el identificador del usuario desde el navegador; ahora el servidor verifica quién es y qué puede hacer."],
            ["Validaciones y reglas de negocio en el servidor, con transacciones",
             "Evita datos inválidos y estados inconsistentes (cantidades excedidas, solicitudes duplicadas, donaciones vencidas o ya reservadas)."],
            ["Interfaz: dirección de la API relativa, escape de HTML, vistas protegidas, botones según el rol, fechas dd/mm/aaaa y ventanas modales con estilo",
             "La aplicación funciona en cualquier dominio, evita inyección de código (XSS) y ofrece una experiencia coherente para cada rol."],
            ["Reportes ampliados e inicio con cifras reales",
             "Las cifras de impacto se calculan desde la base de datos (por unidad y por estado), en lugar de valores fijos."],
            ["Carpeta <code>/database</code> con esquema, datos de ejemplo, volcado y diagrama ER",
             "Requisito de la actividad y facilita reproducir la base en cualquier equipo."],
            ["Despliegue en Render con <code>render.yaml</code>; el servidor Express también entrega el frontend",
             "Un único servicio publica toda la aplicación y se actualiza con cada <i>push</i> al repositorio."],
        ],
        ["42%", "58%"],
    ))
    A(h2("6.3 Despliegue en Render"))
    A("<p>El repositorio incluye <code>render.yaml</code>: al crear un <i>Blueprint</i> en Render apuntando al "
      "repositorio, se crean la base de datos PostgreSQL y el servicio web, ya conectados. Al arrancar, la aplicación "
      "crea las tablas y carga los datos de ejemplo si la base está vacía. Variables de entorno:</p>")
    A("<ul>"
      "<li><code>DATABASE_URL</code>: conexión a PostgreSQL (la inyecta Render).</li>"
      "<li><code>JWT_SECRET</code>: llave para firmar las sesiones (Render genera un valor aleatorio).</li>"
      "<li><code>NODE_ENV</code>: <code>production</code> en el servidor desplegado.</li>"
      "<li>Opcionales: <code>ZONA_HORARIA</code>, <code>SESION_HORAS</code> y <code>CARGAR_DATOS_EJEMPLO</code>.</li>"
      "</ul>")

    # ============ 7. VALIDACIONES / PRUEBAS ============
    A(h1("7. Validaciones, seguridad y pruebas"))
    A(h2("7.1 Validaciones y manejo de errores"))
    A(tabla(
        ["Capa", "Qué se valida"],
        [
            ["Navegador", "Campos obligatorios, formato de correo, contraseña de mínimo 8 caracteres, cantidades positivas y fechas."],
            ["Servidor", "Tipos y longitudes de los datos, unidades y estados permitidos, fechas válidas y no vencidas, identificadores numéricos y propiedad del recurso."],
            ["Negocio", "Cantidad solicitada menor o igual a la disponible; donación no vencida ni reservada; sin solicitudes activas duplicadas; transiciones de estado válidas."],
            ["Base de datos", "Restricciones <code>NOT NULL</code>, <code>CHECK</code>, <code>UNIQUE</code> y llaves foráneas."],
        ],
        ["20%", "80%"], corta=True,
    ))
    A("<p>Los errores se devuelven como JSON con el código HTTP adecuado (400, 401, 403, 404 o 409) y la "
      "interfaz los muestra con un mensaje claro; un manejador central impide que un dato incorrecto detenga el servidor.</p>")
    A(h2("7.2 Seguridad"))
    A("<ul>"
      "<li>Contraseñas con hash <code>scrypt</code> y comparación en tiempo constante.</li>"
      "<li>Consultas SQL parametrizadas (sin concatenar datos del usuario), que previenen la inyección SQL.</li>"
      "<li>Escape del texto de los usuarios antes de mostrarlo (prevención de XSS).</li>"
      "<li>Permisos por rol verificados en el servidor y sesiones con vencimiento.</li>"
      "<li>El archivo <code>.env</code> está excluido del repositorio; solo se publica <code>.env.example</code>.</li>"
      "</ul>")
    A(h2("7.3 Pruebas realizadas"))
    A("<p>Se ejecutaron pruebas automáticas de la API sobre una base PostgreSQL real "
      "(<code>npm test</code>, con <code>DATABASE_URL_TEST</code>), que verifican el registro e inicio de sesión, los "
      "permisos por rol, la validación de datos, la regla de cantidad máxima, la aceptación de solicitudes y su "
      "efecto sobre la donación, el ciclo de vida de las entregas y los reportes.</p>")
    A("<p>También se probó en un navegador el flujo completo desde la interfaz: acceso sin sesión, clave incorrecta, "
      "publicación, fecha de vencimiento pasada, texto con código HTML, cantidad superior a la disponible, solicitud, "
      "aceptación, entrega, reportes y registro de un usuario nuevo.</p>")

    # ============ 8. CONCLUSIONES ============
    A(h1("8. Conclusiones"))
    A("<p>CeroHambre ofrece un flujo completo y verificable para que los alimentos excedentes lleguen a "
      "organizaciones que los necesitan, con reglas que evitan errores operativos, permisos por rol, una base de "
      "datos relacional normalizada y un despliegue reproducible en Render. De esta forma, la solución aporta de "
      "manera concreta al ODS 2 – Hambre Cero y a la reducción del desperdicio de alimentos.</p>")
    A("<p>Como trabajo futuro se proponen las notificaciones por correo, la búsqueda de donaciones cercanas mediante "
      "geolocalización, un panel de administración y el registro del número de personas atendidas por cada "
      "organización para medir el impacto con mayor precisión.</p>")
    return "".join(c)


def portada():
    integrantes = "".join(f"<li>{dato(n)}</li>" for n in CFG["integrantes"])
    return f"""
<section class="portada">
  <div class="uni">{esc(CFG['universidad'])}</div>
  <div class="prog">{dato(CFG['programa'])}</div>
  <div class="centro">
    <div class="curso">{esc(CFG['curso'])}</div>
    <div class="act">{esc(CFG['actividad'])}</div>
    <h1 class="titulo">{esc(CFG['titulo'])}</h1>
    <div class="ods">Informe técnico del proyecto · ODS 2 – Hambre Cero</div>
  </div>
  <div class="datos">
    <div><b>Integrantes</b></div>
    <ul>{integrantes}</ul>
    <div><b>Docente</b></div>
    <div class="doc">{dato(CFG['docente'])}</div>
  </div>
  <div class="lugar">{esc(CFG['ciudad_fecha'])}</div>
</section>"""


def toc(paginas):
    filas = []
    for nivel, texto in ENCABEZADOS:
        pag = paginas.get(texto, "")
        filas.append(
            f'<div class="toc-fila n{nivel}"><span class="t">{esc(texto)}</span>'
            f'<span class="pts"></span><span class="p">{pag}</span></div>'
        )
    return '<section class="toc"><h1 class="sin-salto">Tabla de contenido</h1>' + "".join(filas) + "</section>"


CSS = """
@page { size: Letter; margin: 2.5cm; }
* { box-sizing: border-box; }
html { font-family: Arial, "Liberation Sans", Helvetica, sans-serif; }
body { margin: 0; font-size: 12pt; line-height: 1.5; color: #111; text-align: justify; }
p { margin: 0 0 8pt; }
a { color: #1a5fb4; text-decoration: none; word-break: break-all; }
code { font-family: "Liberation Mono", "Courier New", monospace; font-size: 10pt; background: #f1f3f2; padding: 0 2pt; border-radius: 2pt; }
.pendiente { background: #fff2a8; padding: 0 3pt; }

h1 { font-size: 15pt; margin: 0 0 12pt; padding-bottom: 5pt; border-bottom: 2pt solid #2f7d46; color: #1f5d36;
     page-break-before: always; line-height: 1.3; text-align: left; }
h1.sin-salto { page-break-before: avoid; }
h2 { font-size: 12.5pt; margin: 14pt 0 6pt; color: #1f5d36; page-break-after: avoid; text-align: left; }
h3 { font-size: 12pt; margin: 12pt 0 6pt; page-break-after: avoid; text-align: left; }
ul { margin: 0 0 8pt 0; padding-left: 18pt; }
li { margin-bottom: 3pt; }

table { width: 100%; border-collapse: collapse; margin: 6pt 0 12pt; font-size: 10.5pt; line-height: 1.35; text-align: left; page-break-inside: auto; }
th { background: #2f7d46; color: #fff; padding: 5pt 6pt; text-align: left; border: 0.5pt solid #2f7d46; }
td { padding: 4pt 6pt; border: 0.5pt solid #b9c7be; vertical-align: top; }
tr { page-break-inside: avoid; }
table.corta { page-break-inside: avoid; }
.bloque { page-break-inside: avoid; }
tbody tr:nth-child(even) td { background: #f4f8f5; }
td code { font-size: 9.5pt; }

pre { font-family: "Liberation Mono", "Courier New", monospace; font-size: 8.5pt; line-height: 1.3; text-align: left;
      background: #f6f8f7; border: 0.5pt solid #cfd9d2; border-left: 3pt solid #2f7d46; padding: 7pt 9pt; margin: 6pt 0 10pt;
      white-space: pre-wrap; page-break-inside: avoid; }

figure { margin: 10pt auto 14pt; padding: 0; page-break-inside: avoid; text-align: center; }
.fila-img { display: flex; gap: 2%; justify-content: center; align-items: flex-start; }
figure img { display: block; border: 0.6pt solid #b9c7be; }
figcaption { font-size: 10pt; line-height: 1.3; text-align: center; margin-top: 4pt; color: #333; }

.nota { background: #eef6f0; border-left: 3pt solid #2f7d46; padding: 6pt 9pt; font-size: 11pt; line-height: 1.4; }

.arq { display: grid; grid-template-columns: 1fr 42pt 1fr 42pt 1fr; align-items: center; margin: 8pt 0 12pt; text-align: center; font-size: 10.5pt; line-height: 1.3; }
.arq .caja { border: 1pt solid #2f7d46; border-radius: 6pt; padding: 8pt 5pt; background: #f4f8f5; min-width: 0; }
.arq .caja span { font-size: 9pt; color: #444; }
.arq .flecha { font-size: 15pt; color: #2f7d46; line-height: 1.1; }
.arq .flecha span { font-size: 7.5pt; color: #444; }

.flujo { margin: 6pt 0 12pt; }
.paso { border: 1pt solid #2f7d46; border-radius: 6pt; background: #f4f8f5; padding: 5pt 9pt; margin-bottom: 7pt; font-size: 10.5pt; line-height: 1.35; text-align: left; position: relative; }
.paso b { display: inline-block; width: 15pt; height: 15pt; line-height: 15pt; text-align: center; border-radius: 50%; background: #2f7d46; color: #fff; margin-right: 6pt; font-size: 9.5pt; }
.paso span { display: block; margin-left: 21pt; font-size: 9.5pt; color: #444; }

/* Portada */
.portada { height: 22.4cm; display: flex; flex-direction: column; text-align: center; page-break-after: always; }
.portada .uni { font-size: 17pt; font-weight: bold; color: #1f5d36; margin-top: 0.5cm; }
.portada .prog { font-size: 12pt; margin-top: 4pt; }
.portada .centro { margin: auto 0; padding: 22pt 0; border-top: 3pt solid #2f7d46; border-bottom: 3pt solid #2f7d46; }
.portada .curso { font-size: 14pt; font-weight: bold; }
.portada .act { font-size: 12pt; margin-top: 3pt; }
.portada h1.titulo { font-size: 24pt; line-height: 1.25; border: 0; margin: 20pt 0 14pt; padding: 0; color: #111; page-break-before: avoid; text-align: center; }
.portada .ods { font-size: 12pt; color: #1f5d36; font-weight: bold; }
.portada .datos { text-align: left; margin: 0 auto; width: 70%; }
.portada .datos ul { list-style: none; padding: 0; margin: 2pt 0 10pt; }
.portada .datos li { margin: 0; }
.portada .lugar { margin-top: 1cm; font-size: 12pt; }

/* Tabla de contenido */
.toc { page-break-after: always; }
.toc-fila { display: flex; align-items: baseline; font-size: 12pt; line-height: 1.4; text-align: left; }
.toc-fila.n1 { font-weight: bold; margin-top: 3pt; }
.toc-fila.n2 { padding-left: 16pt; font-size: 10.5pt; line-height: 1.25; }
.toc-fila .t { flex: 0 1 auto; }
.toc-fila .pts { flex: 1 1 auto; border-bottom: 1pt dotted #888; margin: 0 4pt; transform: translateY(-3pt); }
.toc-fila .p { flex: 0 0 auto; }
"""


def documento(paginas):
    cuerpo = contenido_cache
    return f"""<!doctype html><html lang="es"><head><meta charset="utf-8">
<title>Informe Momento 2 – {esc(CFG['proyecto'])}</title><style>{CSS}</style></head>
<body>{portada()}{toc(paginas)}{cuerpo}</body></html>"""


# ----------------------------------------------------------------------
#  Renderizado
# ----------------------------------------------------------------------
def a_pdf(playwright, html_texto):
    BUILD.mkdir(exist_ok=True)
    ruta = BUILD / "informe.html"
    ruta.write_text(html_texto, encoding="utf-8")
    navegador = playwright.chromium.launch()
    pagina = navegador.new_page()
    pagina.goto(ruta.as_uri())
    pagina.wait_for_load_state("networkidle")
    datos = pagina.pdf(prefer_css_page_size=True, print_background=True)
    navegador.close()
    return datos


def paginas_de_encabezados(pdf_bytes):
    lector = PdfReader(io.BytesIO(pdf_bytes))
    textos = [normalizar(p.extract_text() or "") for p in lector.pages]
    idx_toc = next(i for i, t in enumerate(textos) if "tabladecontenido" in t)
    inicio = idx_toc + 1
    primero = normalizar(ENCABEZADOS[0][1])
    assert textos[inicio].startswith(primero), "La tabla de contenido ocupa más de una página"
    resultado = {}
    for _, texto in ENCABEZADOS:
        buscado = normalizar(texto)
        for i in range(inicio, len(textos)):
            if buscado in textos[i]:
                resultado[texto] = i + 1
                inicio = i
                break
        else:
            raise RuntimeError(f"No se encontró el encabezado en el PDF: {texto}")
    return resultado, len(lector.pages)


def fuente_pie():
    candidatas = [
        "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf",
        "C:/Windows/Fonts/arial.ttf",
        "/Library/Fonts/Arial.ttf",
        "/System/Library/Fonts/Supplemental/Arial.ttf",
    ]
    for ruta in candidatas:
        if Path(ruta).exists():
            pdfmetrics.registerFont(TTFont("PieArial", ruta))
            return "PieArial"
    return "Helvetica"


def numerar(pdf_bytes):
    lector = PdfReader(io.BytesIO(pdf_bytes))
    escritor = PdfWriter()
    fuente = fuente_pie()
    total = len(lector.pages)
    for i, pagina in enumerate(lector.pages):
        if i > 0:  # la portada no lleva número
            ancho = float(pagina.mediabox.width)
            buf = io.BytesIO()
            c = canvas.Canvas(buf, pagesize=(ancho, float(pagina.mediabox.height)))
            c.setStrokeColor(HexColor("#b9c7be"))
            c.setLineWidth(0.5)
            c.line(70.87, 52, ancho - 70.87, 52)
            c.setFillColor(HexColor("#555555"))
            c.setFont(fuente, 9)
            c.drawString(70.87, 38, f"{CFG['proyecto']} · {CFG['actividad']}")
            c.drawRightString(ancho - 70.87, 38, f"Página {i + 1} de {total}")
            c.save()
            buf.seek(0)
            pagina.merge_page(PdfReader(buf).pages[0])
        escritor.add_page(pagina)
    escritor.add_metadata({
        "/Title": f"Informe Momento 2 – {CFG['proyecto']}",
        "/Author": ", ".join(n for n in CFG["integrantes"] if not n.startswith("[")),
        "/Subject": "Desarrollo Sostenible – ODS 2 Hambre Cero",
    })
    salida = io.BytesIO()
    escritor.write(salida)
    return salida.getvalue()


contenido_cache = contenido()

if __name__ == "__main__":
    with sync_playwright() as p:
        borrador = a_pdf(p, documento({}))
        paginas, _ = paginas_de_encabezados(borrador)
        final = a_pdf(p, documento(paginas))
        paginas2, total = paginas_de_encabezados(final)
        assert paginas2 == paginas, "La paginación cambió entre pasadas"
    SALIDA.write_bytes(numerar(final))
    print(f"OK: {SALIDA}  ({total} páginas)")
