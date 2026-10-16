"""
Prueba de interfaz de extremo a extremo (navegador real) de CeroHambre.

Recorre el flujo completo con los usuarios de prueba: acceso protegido, login, publicar
donación, validaciones, XSS, solicitud, aceptación, entrega, reportes y registro.
También guarda las capturas de pantalla en docs/capturas.

IMPORTANTE: está pensada para una base de datos RECIÉN CREADA con los datos de ejemplo
(npm run db:reset) y la APLICACIÓN en marcha. Crea y modifica datos, así que no la
ejecutes contra una base con información real.

Uso:
    pip install playwright && playwright install chromium
    cd Backend && npm run db:reset && npm start          # en otra terminal
    BASE_URL=http://localhost:3000 python3 docs/pruebas/e2e_ui.py
"""
import os, sys, re, json, datetime
from pathlib import Path
from playwright.sync_api import sync_playwright, expect

BASE = os.environ.get("BASE_URL", "http://localhost:3000").rstrip("/")
OUT = os.environ.get("CAPTURAS_DIR", str(Path(__file__).resolve().parent.parent / "capturas"))
Path(OUT).mkdir(parents=True, exist_ok=True)
errores = []
pasos = []

def paso(msg):
    pasos.append(msg); print("✔", msg)

def shot(page, nombre, full=True):
    page.evaluate("window.scrollTo(0,0)")
    page.wait_for_timeout(450)
    page.screenshot(path=f"{OUT}/{nombre}.png", full_page=full)

def login(page, correo, clave):
    page.goto(f"{BASE}/login.html")
    page.fill("#correo", correo); page.fill("#password", clave)
    page.click("button.btn-login")
    page.wait_for_url("**/dashboard.html")
    page.wait_for_load_state("networkidle")

def logout(page):
    page.click("text=Cerrar sesión")
    page.wait_for_url("**/login.html")

def confirmar_modal(page):
    page.click("#modalConfirmar")

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={"width": 1366, "height": 850}, locale="es-CO", timezone_id="America/Bogota")
    page = ctx.new_page()
    page.on("pageerror", lambda e: errores.append(f"pageerror: {e}"))
    def _consola(m):
        if m.type != "error": return
        # Los 400/401 de las validaciones y del login incorrecto son deliberados en esta prueba
        if re.search(r"status of (400|401)", m.text): return
        errores.append(f"console.{m.type}: {m.text}")
    page.on("console", _consola)
    page.on("dialog", lambda d: (errores.append(f"dialog: {d.message}"), d.dismiss()))

    # ---------- A. Público ----------
    page.goto(BASE); page.wait_for_load_state("networkidle"); shot(page, "01-inicio")
    paso("Inicio carga")
    page.goto(f"{BASE}/registro.html"); shot(page, "02-registro")
    page.goto(f"{BASE}/login.html"); shot(page, "03-login")

    # Guardas: sin sesión no se entra a páginas privadas
    for pag in ["dashboard", "donaciones", "solicitudes", "entregas", "reportes", "publicar-donacion"]:
        page.goto(f"{BASE}/{pag}.html"); page.wait_for_load_state("networkidle")
        assert page.url.endswith("login.html"), f"{pag} no redirige a login: {page.url}"
    paso("Páginas privadas redirigen al login sin sesión")

    # Login con clave incorrecta
    page.goto(f"{BASE}/login.html")
    page.fill("#correo", "donante@cerohambre.com"); page.fill("#password", "incorrecta1")
    page.click("button.btn-login"); page.wait_for_selector("#mensajeLogin:has-text('incorrectos')")
    assert page.url.endswith("login.html")
    paso("Login con clave incorrecta muestra error y no entra")

    # ---------- B. Donante: vistas con datos de ejemplo ----------
    login(page, "donante@cerohambre.com", "Donante123*")
    expect(page.locator("#nombreUsuario")).to_have_text(re.compile("Restaurante El Fogón"))
    page.wait_for_selector("#actividadReciente .actividad-item")
    shot(page, "04-dashboard-donante"); paso("Dashboard donante con actividad")
    page.goto(f"{BASE}/donaciones.html"); page.wait_for_selector(".donacion-card"); shot(page, "05-donaciones")
    n = page.locator(".donacion-card").count(); assert n == 9, n
    paso(f"Donaciones: {n} tarjetas")
    page.goto(f"{BASE}/solicitudes.html"); page.wait_for_selector(".donacion-card"); shot(page, "07-solicitudes-donante")
    # El donante solo ve solicitudes de SUS donaciones (donante@ tiene 4 solicitudes: papa, almuerzos, ... )
    ns = page.locator(".donacion-card").count(); print("   solicitudes visibles al donante:", ns)
    page.goto(f"{BASE}/entregas.html"); page.wait_for_selector(".donacion-card"); shot(page, "09-entregas-donante")
    page.goto(f"{BASE}/reportes.html"); page.wait_for_selector(".dashboard-card"); page.wait_for_selector(".tabla-reporte"); shot(page, "10-reportes")
    txt = page.locator("#reportesContainer").inner_text()
    assert "255" in txt, txt
    paso("Reportes muestran 255 kg recuperados")

    # ---------- C. Publicar donación (botón que estaba roto) ----------
    page.goto(f"{BASE}/donaciones.html"); page.wait_for_selector(".donacion-card")
    page.click("#btnPublicarDonacion")
    page.wait_for_url("**/publicar-donacion.html")
    paso("Botón '+ Publicar donación' funciona")
    manana = (datetime.date.today() + datetime.timedelta(days=6)).isoformat()
    page.fill("#alimento", "Sopa de verduras casera")
    page.fill("#cantidad", "25"); page.select_option("#unidad", "litros")
    page.fill("#fecha_vencimiento", manana)
    page.fill("#ubicacion", "Cra 13 # 63-20, Chapinero, Bogotá")
    page.fill("#descripcion", "Sopa preparada hoy, refrigerada y empacada en recipientes de 1 litro.")
    shot(page, "06-publicar-donacion")
    page.click("form#donacionForm button[type=submit]")
    page.wait_for_url("**/donaciones.html"); page.wait_for_selector(".donacion-card")
    assert page.locator(".donacion-card", has_text="Sopa de verduras casera").count() == 1
    paso("Donación publicada y visible en la lista (persistida en la BD)")

    # Validación del servidor: fecha pasada
    page.goto(f"{BASE}/publicar-donacion.html")
    page.fill("#alimento", "Prueba"); page.fill("#cantidad", "5"); page.select_option("#unidad", "kg")
    page.evaluate("document.getElementById('fecha_vencimiento').removeAttribute('min')")
    page.fill("#fecha_vencimiento", "2020-01-01"); page.fill("#ubicacion", "Bogotá")
    page.click("form#donacionForm button[type=submit]")
    page.wait_for_selector("#mensajeDonacion:has-text('pasada')")
    paso("El servidor rechaza fecha de vencimiento pasada")

    # XSS: un nombre con HTML se muestra como texto
    page.goto(f"{BASE}/publicar-donacion.html")
    page.fill("#alimento", '<img src=x onerror="window.__xss=1">Pan <b>negrita</b>')
    page.fill("#cantidad", "3"); page.select_option("#unidad", "unidades")
    page.fill("#fecha_vencimiento", manana); page.fill("#ubicacion", "Bogotá")
    page.click("form#donacionForm button[type=submit]")
    page.wait_for_url("**/donaciones.html"); page.wait_for_selector(".donacion-card")
    page.wait_for_timeout(500)
    assert page.evaluate("window.__xss") is None, "XSS ejecutado"
    assert page.locator(".donacion-card h3", has_text="<img src=x").count() == 1
    paso("XSS neutralizado: el HTML se muestra como texto")
    # limpieza: borrar la donación de prueba XSS para que no salga en las capturas siguientes
    borradas = page.evaluate("""async () => {
      const t = localStorage.getItem('tokenCeroHambre');
      const l = await (await fetch('/api/donaciones')).json();
      const arr = Array.isArray(l) ? l : (l.donaciones || []);
      let n = 0;
      for (const d of arr.filter(x => String(x.alimento).includes('<img'))) {
        const r = await fetch('/api/donaciones/' + d.id, {method: 'DELETE', headers: {Authorization: 'Bearer ' + t}});
        if (r.ok) n++;
      }
      return n;
    }""")
    assert borradas == 1, f"no se pudo borrar la donación XSS ({borradas})"
    logout(page)

    # ---------- D. Organización solicita ----------
    login(page, "organizacion@cerohambre.com", "Organizacion123*")
    expect(page.locator("#nombreUsuario")).to_have_text(re.compile("Manos Solidarias"))
    page.wait_for_selector("#actividadReciente .actividad-item")
    shot(page, "04b-dashboard-organizacion")
    page.goto(f"{BASE}/donaciones.html"); page.wait_for_selector(".donacion-card")
    assert not page.locator("#btnPublicarDonacion").is_visible(), "la organización no debe ver Publicar"
    paso("La organización no ve el botón de publicar")
    tarjeta = page.locator(".donacion-card", has_text="Sopa de verduras casera")
    tarjeta.locator("button.btn-solicitar").click()
    page.fill("#cantidadSolicitud", "40")           # más de lo disponible (25 L)
    page.click("#modalConfirmar")
    page.wait_for_selector(".modal-card:has-text('disponible')")
    shot(page, "08b-error-cantidad", full=False)
    paso("Pedir más de lo disponible: el sistema lo rechaza con mensaje")
    page.goto(f"{BASE}/donaciones.html"); page.wait_for_selector(".donacion-card")
    tarjeta = page.locator(".donacion-card", has_text="Sopa de verduras casera")
    tarjeta.locator("button.btn-solicitar").click()
    page.fill("#cantidadSolicitud", "10"); page.click("#modalConfirmar")
    page.wait_for_selector(".modal-card:has-text('correctamente')")
    paso("Organización crea la solicitud de 10 L")
    page.goto(f"{BASE}/solicitudes.html"); page.wait_for_selector(".donacion-card")
    assert page.locator(".donacion-card button.btn-solicitar").count() == 0, "la organización no debe ver Aceptar"
    logout(page)

    # ---------- E. Donante gestiona: aceptar → entrega → entregada ----------
    login(page, "donante@cerohambre.com", "Donante123*")
    page.goto(f"{BASE}/solicitudes.html"); page.wait_for_selector(".donacion-card")
    card = page.locator(".donacion-card").filter(has_text="Sopa de verduras casera").first
    card.locator("button.btn-solicitar", has_text="Aceptar").click(); confirmar_modal(page)
    page.wait_for_selector(".modal-card:has-text('aceptada correctamente')")
    shot(page, "08-solicitud-aceptada", full=False)
    paso("Donante acepta la solicitud (la donación queda reservada)")
    page.goto(f"{BASE}/solicitudes.html"); page.wait_for_selector(".donacion-card")
    page.wait_for_timeout(1300)
    boton = page.locator(".donacion-card", has_text="Sopa de verduras casera").locator("button.btn-solicitar", has_text="Registrar entrega")
    assert page.locator(".donacion-card button.btn-solicitar", has_text="Registrar entrega").count() == 1, "solo debe ofrecerse registrar entrega donde no existe"
    boton.click(); confirmar_modal(page)
    page.wait_for_url("**/entregas.html"); page.wait_for_selector(".donacion-card")
    paso("Donante registra la entrega")
    pend = page.locator(".donacion-card", has_text="Sopa de verduras casera")
    pend.locator("button.btn-solicitar", has_text="Enviar").click(); confirmar_modal(page)
    page.wait_for_timeout(1800)
    page.locator(".donacion-card", has_text="Sopa de verduras casera").locator("button.btn-solicitar", has_text="Marcar como entregada").click(); confirmar_modal(page)
    page.wait_for_selector(".modal-card:has-text('completada')"); page.wait_for_timeout(1700)
    shot(page, "09b-entregas-despues")
    paso("Entrega marcada como entregada")
    page.goto(f"{BASE}/reportes.html"); page.wait_for_selector(".tabla-reporte"); shot(page, "10b-reportes-despues")
    txt = page.locator("#reportesContainer").inner_text()
    print("   reportes:", " | ".join(txt.split("\n")[:30]).replace("\n"," ")[:300])
    logout(page)

    # ---------- F. Registro por la UI ----------
    page.goto(f"{BASE}/registro.html")
    page.fill("#nombre", "Fundación Prueba UI"); page.fill("#correoRegistro", "prueba.ui@correo.com")
    page.fill("#passwordRegistro", "Clave12345"); page.select_option("#tipo_usuario", "organizacion"); page.fill("#ubicacion", "Cali, Valle del Cauca")
    page.click("button.btn-login"); page.wait_for_selector("#mensajeRegistro:has-text('correctamente'), #mensajeRegistro:has-text('exitos')")
    page.wait_for_url("**/login.html", timeout=8000)
    login(page, "prueba.ui@correo.com", "Clave12345")
    paso("Registro desde la interfaz + inicio de sesión del nuevo usuario")

    b.close()

print("\nPASOS:", len(pasos))
print("ERRORES DE CONSOLA/PÁGINA:", len(errores))
for e in errores: print("  -", e)
sys.exit(1 if errores else 0)
