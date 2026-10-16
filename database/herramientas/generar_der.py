#!/usr/bin/env python3
"""
Genera el diagrama entidad-relación (DER) a partir de la base de datos REAL,
para que el diagrama siempre coincida con el esquema implementado.

Requisitos: psql. Para exportar el PNG: `pip install playwright` + Chromium
(si no están, solo se genera el SVG, que también se puede abrir en el navegador).

Uso:
    python3 database/herramientas/generar_der.py "postgresql://usuario:clave@localhost:5432/cerohambre"
Salida: database/DER.svg y database/DER.png (alta resolución)
"""
import subprocess
import sys
from collections import OrderedDict
from html import escape
from pathlib import Path

if len(sys.argv) < 2:
    sys.exit(__doc__)

URL = sys.argv[1]
SALIDA = Path(__file__).resolve().parent.parent
TABLAS = ["usuarios", "donaciones", "solicitudes", "entregas"]


def consulta(sql):
    r = subprocess.run(["psql", URL, "-X", "-At", "-F", "|", "-c", sql],
                       capture_output=True, text=True, check=True)
    return [l.split("|") for l in r.stdout.strip().splitlines() if l]


lista = ",".join(f"'{t}'" for t in TABLAS)

# ---------------------------------------------------------------- esquema real
columnas = consulta(f"""
    SELECT c.relname, a.attname, format_type(a.atttypid, a.atttypmod), a.attnotnull
    FROM pg_attribute a
    JOIN pg_class c ON c.oid = a.attrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace AND n.nspname = 'public'
    WHERE c.relname IN ({lista}) AND a.attnum > 0 AND NOT a.attisdropped
    ORDER BY c.relname, a.attnum""")

restricciones = consulta(f"""
    SELECT c.relname, con.contype, a.attname
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY(con.conkey)
    WHERE c.relname IN ({lista}) AND con.contype IN ('p','u','f')""")

fks = consulta(f"""
    SELECT c.relname, a.attname, r.relname, ra.attname
    FROM pg_constraint con
    JOIN pg_class c ON c.oid = con.conrelid
    JOIN pg_class r ON r.oid = con.confrelid
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = con.conkey[1]
    JOIN pg_attribute ra ON ra.attrelid = con.confrelid AND ra.attnum = con.confkey[1]
    WHERE con.contype = 'f' AND c.relname IN ({lista})""")

pk, uk, fk = set(), set(), set()
for tabla, tipo, col in restricciones:
    {"p": pk, "u": uk, "f": fk}[tipo].add((tabla, col))

modelo = OrderedDict((t, []) for t in TABLAS)
for tabla, col, tipo, notnull in columnas:
    tipo = (tipo.replace("character varying", "VARCHAR").replace("timestamp with time zone", "TIMESTAMPTZ")
            .replace("numeric", "NUMERIC").replace("integer", "INTEGER").replace("date", "DATE").replace("text", "TEXT"))
    modelo[tabla].append((col, tipo, notnull == "t"))

# ---------------------------------------------------------------- dibujo (SVG)
ANCHO, ALTO_FILA, ALTO_TITULO = 330, 30, 42
COLOR = {"usuarios": "#2f7d46", "donaciones": "#1f6f8b", "solicitudes": "#a35d00", "entregas": "#6a4c93"}
POS = {"donaciones": (170, 70), "usuarios": (170, 520), "solicitudes": (700, 150), "entregas": (700, 560)}


def alto(t):
    return ALTO_TITULO + ALTO_FILA * len(modelo[t])


def fila_y(t, col):
    """Coordenada Y del centro de la fila de la columna."""
    idx = [c[0] for c in modelo[t]].index(col)
    return POS[t][1] + ALTO_TITULO + ALTO_FILA * idx + ALTO_FILA / 2


def borde_x(t, lado):
    return POS[t][0] + (ANCHO if lado == "der" else 0)


svg = []
ancho_total = POS["solicitudes"][0] + ANCHO + 70
alto_total = max(POS[t][1] + alto(t) for t in TABLAS) + 50

svg.append(f'<svg xmlns="http://www.w3.org/2000/svg" width="{ancho_total}" height="{alto_total}" '
           f'viewBox="0 0 {ancho_total} {alto_total}" font-family="Arial, Helvetica, sans-serif">')
svg.append(f'<rect width="100%" height="100%" fill="#ffffff"/>')
svg.append(f'<text x="{ancho_total/2}" y="38" text-anchor="middle" font-size="24" font-weight="bold" fill="#17231b">'
           f'CeroHambre – Diagrama entidad-relación (PostgreSQL)</text>')

# Tablas
for t in TABLAS:
    x, y = POS[t]
    h = alto(t)
    svg.append(f'<rect x="{x}" y="{y}" width="{ANCHO}" height="{h}" fill="#fff" stroke="#444" stroke-width="1.5"/>')
    svg.append(f'<rect x="{x}" y="{y}" width="{ANCHO}" height="{ALTO_TITULO}" fill="{COLOR[t]}"/>')
    svg.append(f'<text x="{x + ANCHO/2}" y="{y + 28}" text-anchor="middle" font-size="20" font-weight="bold" fill="#fff">{t}</text>')
    for i, (col, tipo, notnull) in enumerate(modelo[t]):
        cy = y + ALTO_TITULO + ALTO_FILA * i + ALTO_FILA / 2 + 5
        if i > 0:
            svg.append(f'<line x1="{x}" y1="{cy - 20}" x2="{x + ANCHO}" y2="{cy - 20}" stroke="#e5e7eb"/>')
        marcas = [m for m, c in (("PK", (t, col) in pk), ("FK", (t, col) in fk), ("UK", (t, col) in uk and (t, col) not in pk)) if c]
        nulo = "" if notnull else " · null"
        svg.append(f'<text x="{x + 12}" y="{cy}" font-size="14" font-weight="bold" fill="#111">{col}</text>')
        svg.append(f'<text x="{x + 175}" y="{cy}" font-size="13" fill="#555">{escape(tipo + nulo)}</text>')
        if marcas:
            svg.append(f'<text x="{x + ANCHO - 10}" y="{cy}" text-anchor="end" font-size="13" font-weight="bold" fill="#b00020">{", ".join(marcas)}</text>')


# Símbolos de cardinalidad (notación pata de gallo)
def simbolo(px, py, lado, tipo):
    """(px,py) = punto sobre el borde de la tabla; lado = lado de la tabla donde se conecta."""
    ux, uy = {"izq": (-1, 0), "der": (1, 0), "sup": (0, -1), "inf": (0, 1)}[lado]
    tx, ty = -uy, ux
    pt = lambda d, o=0: (px + ux * d + tx * o, py + uy * d + ty * o)
    out = []
    linea = lambda a, b: out.append(f'<line x1="{a[0]:.1f}" y1="{a[1]:.1f}" x2="{b[0]:.1f}" y2="{b[1]:.1f}" stroke="#222" stroke-width="2"/>')
    circulo = lambda d: out.append(f'<circle cx="{pt(d)[0]:.1f}" cy="{pt(d)[1]:.1f}" r="5.5" fill="#fff" stroke="#222" stroke-width="2"/>')
    if tipo == "uno":              # exactamente uno  ||
        linea(pt(10, -8), pt(10, 8)); linea(pt(17, -8), pt(17, 8))
    elif tipo == "cero_muchos":    # cero o muchos  o<
        linea(pt(16, 0), pt(0, -9)); linea(pt(16, 0), pt(0, 9)); linea(pt(16, 0), pt(0, 0)); circulo(23)
    elif tipo == "cero_uno":       # cero o uno  o|
        linea(pt(10, -8), pt(10, 8)); circulo(19)
    return out


def trazo(puntos):
    d = "M " + " L ".join(f"{x:.1f},{y:.1f}" for x, y in puntos)
    return f'<path d="{d}" fill="none" stroke="#222" stroke-width="2"/>'


def etiqueta(x, y, nombre, card, ancla="middle"):
    return (f'<text x="{x}" y="{y}" text-anchor="{ancla}" font-size="14" font-weight="bold" fill="#17231b" '
            f'paint-order="stroke" stroke="#fff" stroke-width="5">{nombre}</text>'
            f'<text x="{x}" y="{y + 17}" text-anchor="{ancla}" font-size="13" fill="#444" '
            f'paint-order="stroke" stroke="#fff" stroke-width="5">{card}</text>')


ETIQUETAS = {("donaciones", "usuarios"): "publica", ("solicitudes", "donaciones"): "recibe",
             ("solicitudes", "usuarios"): "realiza", ("entregas", "solicitudes"): "genera"}

lineas, simbolos, textos = [], [], []
for hija, col, madre, colref in fks:
    nombre = ETIQUETAS.get((hija, madre), "")
    uno_a_uno = (hija, col) in uk
    card = "1 : 0..1" if uno_a_uno else "1 : N"
    tipo_hija = "cero_uno" if uno_a_uno else "cero_muchos"

    if (madre, hija) == ("usuarios", "donaciones"):
        # Ambas en la columna izquierda: se rodea por el margen izquierdo
        y1, y2 = fila_y("usuarios", colref), fila_y("donaciones", col)
        x0 = borde_x("usuarios", "izq")
        xm = x0 - 55
        lineas.append(trazo([(x0, y1), (xm, y1), (xm, y2), (borde_x("donaciones", "izq"), y2)]))
        simbolos += simbolo(x0, y1, "izq", "uno") + simbolo(borde_x("donaciones", "izq"), y2, "izq", tipo_hija)
        textos.append(etiqueta(xm - 8, (y1 + y2) / 2, nombre, card, "end"))
    elif (madre, hija) == ("solicitudes", "entregas"):
        x = POS["solicitudes"][0] + ANCHO / 2
        ya, yb = POS["solicitudes"][1] + alto("solicitudes"), POS["entregas"][1]
        lineas.append(trazo([(x, ya), (x, yb)]))
        simbolos += simbolo(x, ya, "inf", "uno") + simbolo(x, yb, "sup", tipo_hija)
        textos.append(etiqueta(x + 14, (ya + yb) / 2 - 4, nombre, card, "start"))
    else:
        # Madre a la izquierda, hija a la derecha: recorrido ortogonal por el espacio central
        y1, y2 = fila_y(madre, colref), fila_y(hija, col)
        xa, xb = borde_x(madre, "der"), borde_x(hija, "izq")
        xm = xa + (xb - xa) * (0.35 if madre == "donaciones" else 0.65)
        lineas.append(trazo([(xa, y1), (xm, y1), (xm, y2), (xb, y2)]))
        simbolos += simbolo(xa, y1, "der", "uno") + simbolo(xb, y2, "izq", tipo_hija)
        textos.append(etiqueta(xm + (10 if madre == "donaciones" else -10), (y1 + y2) / 2 + (0 if madre == "donaciones" else 40),
                               nombre, card, "start" if madre == "donaciones" else "end"))

svg += lineas + simbolos + textos

# Leyenda
lx, ly = 60, alto_total - 22
svg.append(f'<text x="{lx}" y="{ly}" font-size="12" fill="#555">PK = llave primaria · FK = llave foránea · UK = valor único · '
           f'|| uno (obligatorio) · o&lt; cero o muchos · o| cero o uno</text>')
svg.append("</svg>")

ruta_svg = SALIDA / "DER.svg"
ruta_svg.write_text("\n".join(svg), encoding="utf-8")
print("Generado:", ruta_svg)

try:
    from playwright.sync_api import sync_playwright
    with sync_playwright() as p:
        navegador = p.chromium.launch()
        pagina = navegador.new_page(viewport={"width": int(ancho_total), "height": int(alto_total)}, device_scale_factor=3)
        pagina.goto(ruta_svg.as_uri())
        pagina.screenshot(path=str(SALIDA / "DER.png"))
        navegador.close()
    print("Generado:", SALIDA / "DER.png")
except Exception as e:  # noqa
    print("No se pudo exportar el PNG (instala playwright) – usa DER.svg:", e)
