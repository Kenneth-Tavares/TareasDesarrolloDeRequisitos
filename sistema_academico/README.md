# Portal Académico (Flask)
```
pip install -r requirements.txt
python app.py                      # desarrollo: http://127.0.0.1:5000
python tests/evidencias.py         # pruebas / evidencias
SECRET_KEY=<clave-larga> HTTPS=1 gunicorn -w 2 app:app   # producción (detrás de HTTPS)
```
Usuarios demo: prof1/prof12345, prof2/prof12345, alumno1/alumno123, alumno2/alumno123 (CAMBIAR antes de producción).
