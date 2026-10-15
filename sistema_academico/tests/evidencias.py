"""Pruebas automáticas = evidencias de los atributos de calidad. Ejecutar: python tests/evidencias.py"""
import os, sys, re, time, tempfile, sqlite3
os.environ["DB_PATH"] = os.path.join(tempfile.mkdtemp(), "t.db")
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import app as A
A.app.config["TESTING"] = True
res = []
def chk(attr, desc, ok): res.append((attr, desc, "PASA" if ok else "FALLA"))
def tok(c, url): return re.search(r'name="csrf_token" value="(\w+)"', c.get(url).get_data(as_text=True)).group(1)
def cliente(u=None, p=None):
    c = A.app.test_client()
    if u: c.post("/login", data={"usuario": u, "password": p, "csrf_token": tok(c, "/login")})
    return c

c = cliente(); lg = c.get("/login").get_data(as_text=True)
chk("Seguridad", "Sin sesión, /alumno y /profesor redirigen a login", c.get("/alumno").status_code == 302 and c.get("/profesor").status_code == 302)
chk("Seguridad", "POST sin token CSRF es rechazado (400)", c.post("/login", data={"usuario":"a","password":"b"}).status_code == 400)
h = c.get("/login").headers
chk("Seguridad", "Cabeceras CSP / X-Frame-Options / nosniff presentes", all(k in h for k in ("Content-Security-Policy","X-Frame-Options","X-Content-Type-Options")))
hs = [r[0] for r in sqlite3.connect(A.app.config["DB"]).execute("SELECT hash FROM usuarios")]
chk("Seguridad", "Contraseñas almacenadas con hash (no en texto plano)", all(x.startswith(("scrypt","pbkdf2")) for x in hs))
a = cliente("alumno1", "alumno123"); pagina = a.get("/alumno").get_data(as_text=True)
chk("Seguridad", "Alumno1 ve sus datos y NO los de Alumno2", "Matem" in pagina and "Luis" not in pagina and "7.5" not in pagina)
chk("Seguridad", "Alumno no accede a área de profesores ni edita (403)", a.get("/profesor").status_code == 403 and a.get("/profesor/materia/1").status_code == 403)
p = cliente("prof1", "prof12345")
chk("Seguridad", "Profesor no puede editar materia ajena (403)", p.get("/profesor/materia/3").status_code == 403)
t = tok(p, "/profesor/materia/1")
r = p.post("/profesor/materia/1", data={"csrf_token": t, "c_1": "7.5"}, follow_redirects=True)
chk("Seguridad", "Profesor modifica calificación de su materia (flujo permitido)", "guardadas correctamente" in r.get_data(as_text=True))
r = p.post("/profesor/materia/1", data={"csrf_token": t, "c_1": "15"}, follow_redirects=True)
chk("Seguridad", "Calificación fuera de 0-10 es rechazada", "inválidas" in r.get_data(as_text=True))
b = cliente(); tb = tok(b, "/login")
cods = [b.post("/login", data={"usuario":"alumno1","password":"mal","csrf_token":tb}).status_code for _ in range(6)]
chk("Seguridad", "Bloqueo temporal tras 5 intentos fallidos (429)", cods[-1] == 429)
chk("Usabilidad", "Diseño adaptable a móvil y campos con etiqueta", 'name="viewport"' in lg and "<label>" in lg)
chk("Usabilidad", "Profesor captura todo el grupo en un envío ('Guardar todo')", "Guardar todo" in p.get("/profesor/materia/1").get_data(as_text=True))
chk("Usabilidad", "Alumno ve promedio y estado Aprobada/Reprobada sin cálculos", "Promedio actual" in pagina and "Aprobada" in pagina)
A.INTENTOS.clear()  # el bloqueo anterior es por IP
_c = cliente(); _r = _c.post("/login", data={"usuario":"x","password":"y","csrf_token":tok(_c,"/login")})
chk("Usabilidad", "Mensaje de error claro ante credenciales incorrectas", "incorrectos" in _r.get_data(as_text=True))
t0 = time.perf_counter()
for _ in range(50): a.get("/alumno")
ms = (time.perf_counter() - t0) / 50 * 1000
chk("Disponibilidad", f"Consulta de calificaciones: {ms:.1f} ms promedio (50 solicitudes)", ms < 100)
chk("Disponibilidad", "Sin dependencias externas (CDN/fuentes): un solo servidor basta", "http" not in lg.replace("http-equiv",""))
print("Atributo | Prueba | Resultado")
for x in res: print(f"{x[0]} | {x[1]} | {x[2]}")
print(f"\nTotal: {sum(r[2]=='PASA' for r in res)}/{len(res)} pruebas aprobadas")
