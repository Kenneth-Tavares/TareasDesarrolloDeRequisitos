"""Sistema de consulta y registro de calificaciones (Flask + SQLite)."""
import os, sqlite3, secrets, time
from functools import wraps
from flask import (Flask, g, render_template, request, redirect, url_for,
                   session, abort, flash)
from werkzeug.security import generate_password_hash, check_password_hash

BASE = os.path.dirname(os.path.abspath(__file__))
app = Flask(__name__)
app.config.update(
    SECRET_KEY=os.environ.get("SECRET_KEY") or secrets.token_hex(32),
    DB=os.environ.get("DB_PATH", os.path.join(BASE, "academico.db")),
    SESSION_COOKIE_HTTPONLY=True, SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("HTTPS", "0") == "1",
    PERMANENT_SESSION_LIFETIME=1800,           # sesión de 30 min
)
INTENTOS, BLOQUEO = {}, 60                      # 5 fallos -> 60 s de espera
APROBATORIA = 6.0

# ---------- Base de datos ----------
def db():
    if "db" not in g:
        g.db = sqlite3.connect(app.config["DB"])
        g.db.row_factory = sqlite3.Row
        g.db.execute("PRAGMA foreign_keys=ON")
    return g.db

@app.teardown_appcontext
def cerrar(_):
    c = g.pop("db", None)
    if c: c.close()

def init_db():
    c = sqlite3.connect(app.config["DB"])
    c.executescript("""
    CREATE TABLE IF NOT EXISTS usuarios(id INTEGER PRIMARY KEY, usuario TEXT UNIQUE NOT NULL,
        hash TEXT NOT NULL, rol TEXT NOT NULL CHECK(rol IN('alumno','profesor')), nombre TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS materias(id INTEGER PRIMARY KEY, nombre TEXT NOT NULL,
        profesor_id INTEGER NOT NULL REFERENCES usuarios(id));
    CREATE TABLE IF NOT EXISTS inscripciones(id INTEGER PRIMARY KEY,
        alumno_id INTEGER NOT NULL REFERENCES usuarios(id),
        materia_id INTEGER NOT NULL REFERENCES materias(id),
        calificacion REAL CHECK(calificacion IS NULL OR (calificacion>=0 AND calificacion<=10)),
        UNIQUE(alumno_id, materia_id));
    CREATE INDEX IF NOT EXISTS ix_insc_alumno ON inscripciones(alumno_id);
    CREATE INDEX IF NOT EXISTS ix_insc_materia ON inscripciones(materia_id);""")
    if not c.execute("SELECT 1 FROM usuarios").fetchone():   # datos de demostración
        U = [("prof1","prof12345","profesor","Laura Méndez"),("prof2","prof12345","profesor","Carlos Ruiz"),
             ("alumno1","alumno123","alumno","Ana Torres"),("alumno2","alumno123","alumno","Luis Pérez")]
        for u,p,r,n in U:
            c.execute("INSERT INTO usuarios(usuario,hash,rol,nombre) VALUES(?,?,?,?)",(u,generate_password_hash(p),r,n))
        c.executemany("INSERT INTO materias(nombre,profesor_id) VALUES(?,?)",
            [("Matemáticas",1),("Inglés",1),("Informática",2)])
        c.executemany("INSERT INTO inscripciones(alumno_id,materia_id,calificacion) VALUES(?,?,?)",
            [(3,1,9.0),(3,2,8.5),(3,3,None),(4,1,6.0),(4,3,7.5)])
    c.commit(); c.close()

# ---------- Seguridad ----------
@app.context_processor
def inyectar():
    session.setdefault("csrf", secrets.token_hex(16))
    return {"csrf": session["csrf"]}

@app.before_request
def csrf():
    if request.method == "POST":
        if not secrets.compare_digest(request.form.get("csrf_token",""), session.get("csrf","x")):
            abort(400)

@app.after_request
def cabeceras(r):
    r.headers["Content-Security-Policy"] = "default-src 'self'; style-src 'self'; frame-ancestors 'none'"
    r.headers["X-Content-Type-Options"] = "nosniff"
    r.headers["X-Frame-Options"] = "DENY"
    r.headers["Referrer-Policy"] = "no-referrer"
    if request.endpoint != "static": r.headers["Cache-Control"] = "no-store"
    return r

def requiere(rol):
    def deco(f):
        @wraps(f)
        def w(*a, **k):
            if "uid" not in session: return redirect(url_for("login"))
            if session.get("rol") != rol: abort(403)
            return f(*a, **k)
        return w
    return deco

# ---------- Rutas ----------
@app.route("/")
def inicio():
    if "uid" not in session: return redirect(url_for("login"))
    return redirect(url_for("alumno" if session["rol"] == "alumno" else "profesor"))

@app.route("/login", methods=["GET","POST"])
def login():
    if request.method == "POST":
        ip = request.remote_addr
        n, t = INTENTOS.get(ip, (0, 0))
        if n >= 5 and time.time() - t < BLOQUEO:
            flash("Demasiados intentos. Espere un minuto e intente de nuevo.")
            return render_template("login.html"), 429
        u = db().execute("SELECT * FROM usuarios WHERE usuario=?", (request.form.get("usuario","").strip(),)).fetchone()
        if u and check_password_hash(u["hash"], request.form.get("password","")):
            INTENTOS.pop(ip, None); session.clear(); session.permanent = True
            session.update(uid=u["id"], rol=u["rol"], nombre=u["nombre"])
            return redirect(url_for("inicio"))
        INTENTOS[ip] = (n + 1, time.time())
        flash("Usuario o contraseña incorrectos.")
        return render_template("login.html"), 401
    return render_template("login.html")

@app.post("/logout")
def logout():
    session.clear(); return redirect(url_for("login"))

@app.route("/alumno")
@requiere("alumno")
def alumno():
    filas = db().execute("""SELECT m.nombre materia, p.nombre profesor, i.calificacion
        FROM inscripciones i JOIN materias m ON m.id=i.materia_id JOIN usuarios p ON p.id=m.profesor_id
        WHERE i.alumno_id=? ORDER BY m.nombre""", (session["uid"],)).fetchall()   # solo SUS datos
    cal = [f["calificacion"] for f in filas if f["calificacion"] is not None]
    prom = round(sum(cal)/len(cal), 1) if cal else None
    return render_template("alumno.html", filas=filas, promedio=prom, aprob=APROBATORIA)

@app.route("/profesor")
@requiere("profesor")
def profesor():
    ms = db().execute("""SELECT m.id, m.nombre, COUNT(i.id) alumnos FROM materias m
        LEFT JOIN inscripciones i ON i.materia_id=m.id WHERE m.profesor_id=? GROUP BY m.id""", (session["uid"],)).fetchall()
    return render_template("profesor.html", materias=ms)

def materia_propia(mid):
    m = db().execute("SELECT * FROM materias WHERE id=? AND profesor_id=?", (mid, session["uid"])).fetchone()
    if not m: abort(403)          # un profesor solo edita SUS materias
    return m

@app.route("/profesor/materia/<int:mid>", methods=["GET","POST"])
@requiere("profesor")
def materia(mid):
    m = materia_propia(mid)
    if request.method == "POST":
        errores, cambios = [], []
        for k, v in request.form.items():
            if not k.startswith("c_"): continue
            iid, v = k[2:], v.strip().replace(",", ".")
            try:
                val = None if v == "" else float(v)
                if val is not None and not 0 <= val <= 10: raise ValueError
                cambios.append((val, int(iid), mid))
            except ValueError:
                errores.append(v)
        if errores:
            flash("Hay calificaciones inválidas (use números de 0 a 10). No se guardó nada.")
        else:
            db().executemany("UPDATE inscripciones SET calificacion=? WHERE id=? AND materia_id=?", cambios)
            db().commit(); flash("Calificaciones guardadas correctamente.")
        return redirect(url_for("materia", mid=mid))
    al = db().execute("""SELECT i.id, u.nombre, i.calificacion FROM inscripciones i
        JOIN usuarios u ON u.id=i.alumno_id WHERE i.materia_id=? ORDER BY u.nombre""", (mid,)).fetchall()
    return render_template("materia.html", m=m, alumnos=al)

init_db()
if __name__ == "__main__":
    app.run(debug=False)
