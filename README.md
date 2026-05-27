# Gestor de Prompts

Aplicación web para gestionar secciones de prompts de IA con control de acceso por usuario, historial, límites de uso y panel de administración.

**Stack:** FastAPI · SQLite · React 19 · Tailwind CSS · Vite

---

## Características

- Secciones de prompts configurables con variables dinámicas
- Modelos soportados: GPT-4o, GPT-4o mini, GPT-4 Turbo, o1, o3-mini, Gemini 2.5 Pro/Flash, ChatGPT Manual
- Subida de archivos (PDF, Word, Excel, imágenes)
- Streaming de respuestas por SSE
- Historial con export a CSV y PDF
- Control de acceso por sección y límites diarios/mensuales por usuario
- Panel admin: usuarios, secciones, auditoría, limpieza de archivos
- Modo oscuro / claro

---

## Instalación

### Requisitos

- Python 3.11+
- Node.js 18+

### Backend

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Copia el archivo de entorno y rellena las claves:

```bash
cp .env.example .env
```

### Frontend

```bash
cd frontend
npm install
npm run build
cd ..
```

---

## Configuración (`.env`)

```env
SECRET_KEY=cambia_esto_por_algo_seguro

# OpenAI (obligatorio para modelos GPT)
OPENAI_API_KEY=sk-...

# Google Gemini (opcional)
GEMINI_API_KEY=AIza...
```

---

## Arrancar

```bash
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

O usa el script incluido:

```bash
bash start.sh          # Linux / macOS
iniciar.bat            # Windows
```

La app queda disponible en `http://localhost:8000`.

---

## Variables de prompt

Las secciones soportan dos formatos de variables:

| Variable moderna | Variable legacy | Descripción |
|---|---|---|
| `{{text}}` | `{TEXTO_CLIENTE}` | Texto introducido por el usuario |
| `{{file_content}}` | `{TEXTO_DEL_ARCHIVO}` | Contenido extraído del archivo |
| `{{filename}}` | — | Nombre del archivo adjunto |
| `{{user_name}}` | `{USUARIO}` | Nombre del usuario |
| `{{department}}` | `{DEPARTAMENTO}` | Departamento del usuario |
| `{{date}}` | `{FECHA}` | Fecha actual |

---

## Estructura

```
├── main.py            # API FastAPI (endpoints, lógica, streaming)
├── models.py          # Modelos SQLAlchemy
├── database.py        # Configuración de la base de datos
├── requirements.txt
├── start.sh
├── .env.example
├── asserts/           # Logo y recursos estáticos
├── data/consultas/    # Archivos subidos (excluidos del repo)
├── tests/
└── frontend/
    ├── src/
    │   ├── pages/     # Vistas: Client, Historial, admin/*
    │   ├── components/
    │   ├── contexts/
    │   └── lib/api.js # Cliente HTTP
    └── dist/          # Build compilado (servido por FastAPI)
```

---

## Admin

Accede al panel de administración en `/admin`. El primer usuario con `is_admin=true` se crea directamente en la base de datos o mediante el endpoint de seed inicial.
