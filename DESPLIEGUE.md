# Manual de Despliegue — Gestor IA · Correduría de Seguros

## Resumen

Guía para instalar la aplicación en un PC Windows 10 y que todos los demás equipos de la red local accedan desde su navegador.

---

## ⚠️ Requisito previo: API Key de OpenAI

> **Importante:** Esta app usa la API de OpenAI (el mismo modelo que hay detrás de ChatGPT).  
> La suscripción ChatGPT Plus/Pro (web) **no** incluye acceso a la API — son productos separados.

### Cómo obtener tu API Key

1. Ve a **[platform.openai.com](https://platform.openai.com)** e inicia sesión (puedes usar la misma cuenta de ChatGPT).
2. Menú → **API keys** → **Create new secret key**.
3. Copia la clave (empieza por `sk-...`). **Solo se muestra una vez.**
4. En **Billing → Add payment method**, añade una tarjeta y carga crédito (mínimo recomendado: 10 €).

> Los modelos `gpt-4o` y `gpt-4o-mini` son de pago por uso. Una consulta habitual cuesta entre 0,01 € y 0,05 €.

---

## Requisitos del servidor (PC principal)

| Elemento | Mínimo | Recomendado |
|----------|--------|-------------|
| SO | Windows 10 | Windows 10/11 |
| CPU | Intel i3 (cualquier generación) | i5 o superior |
| RAM | 4 GB libres | 8 GB (bien para este equipo) |
| Disco | 500 MB libres | 2 GB |
| Red | IP fija en la red local | IP fija por DHCP reservado |
| Python | 3.10+ | 3.11 o 3.12 |
| Node.js | 18+ | 20 LTS |

---

## 1. Instalación inicial (solo la primera vez)

### 1.1 Instalar Python

1. Ve a [python.org/downloads](https://www.python.org/downloads/) y descarga Python 3.11 o 3.12.
2. Ejecuta el instalador. **Marca "Add Python to PATH"** antes de instalar.
3. Verifica en CMD: `python --version`

### 1.2 Instalar Node.js

1. Ve a [nodejs.org](https://nodejs.org/) y descarga la versión **LTS (20.x)**.
2. Instala con opciones por defecto.
3. Verifica en CMD: `node --version`

### 1.3 Copiar los archivos del proyecto

Coloca la carpeta del proyecto en el servidor, por ejemplo:

```
C:\gestor-prompts\
```

### 1.4 Crear el entorno virtual e instalar dependencias Python

Abre **CMD o PowerShell** en la carpeta del proyecto:

```batch
cd C:\gestor-prompts

python -m venv venv
venv\Scripts\activate

pip install -r requirements.txt
```

### 1.5 Compilar el frontend React (obligatorio)

```batch
cd frontend
npm install
npm run build
cd ..
```

Esto genera `frontend\dist\` que FastAPI sirve automáticamente.

### 1.6 Configurar las variables de entorno

Copia el archivo de ejemplo:

```batch
copy .env.example .env
notepad .env
```

Edita los valores:

```dotenv
OPENAI_API_KEY=sk-XXXXXXXXXXXXXXXXXXXXXXXX
ADMIN_PASSWORD=contraseña-segura-aqui
SECRET_KEY=cadena-aleatoria-larga-y-unica
OPENAI_MODEL=gpt-4o
```

> **Nunca compartas ni subas el archivo `.env`.**

---

## 2. Arrancar la aplicación

### Opción A — Script de inicio rápido

Doble clic en `iniciar.bat` (o créalo si no existe):

```batch
@echo off
cd /d "%~dp0"
call venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000
pause
```

### Opción B — CMD manual

```batch
cd C:\gestor-prompts
venv\Scripts\activate
uvicorn main:app --host 0.0.0.0 --port 8000
```

La app estará en `http://localhost:8000`.

---

## 3. Acceso desde otros equipos de la red

Con `--host 0.0.0.0` la app escucha en todas las interfaces de red.

### Conocer la IP del servidor

```batch
ipconfig
```

Busca **Dirección IPv4** en el adaptador de red activo (p. ej. `192.168.1.50`).

Los demás equipos abren en su navegador:

```
http://192.168.1.50:8000
```

---

## 4. Arranque automático al encender Windows

### Opción A — Carpeta de inicio (sencillo)

1. Pulsa `Win + R` → escribe `shell:startup` → Enter.
2. Crea un acceso directo a `iniciar.bat` en esa carpeta.
3. La app arrancará cada vez que el usuario inicie sesión.

### Opción B — Servicio de Windows con NSSM (recomendado para servidor)

NSSM convierte la app en un servicio real que arranca aunque nadie inicie sesión.

1. Descarga [nssm.cc](https://nssm.cc/download) y extrae en `C:\tools\nssm\`.
2. Abre CMD como **Administrador**:

```batch
C:\tools\nssm\win64\nssm.exe install GestorIA
```

3. En la ventana que aparece:
   - **Path:** `C:\gestor-prompts\venv\Scripts\uvicorn.exe`
   - **Startup directory:** `C:\gestor-prompts`
   - **Arguments:** `main:app --host 0.0.0.0 --port 8000`
4. Haz clic en **Install service**.
5. Inicia el servicio:

```batch
net start GestorIA
```

Para detenerlo: `net stop GestorIA`  
Para desinstalarlo: `nssm remove GestorIA`

---

## 5. Firewall de Windows — permitir el puerto 8000

Si los otros equipos no pueden conectar:

1. Busca **"Firewall de Windows con seguridad avanzada"**.
2. **Reglas de entrada → Nueva regla**.
3. Tipo: **Puerto** → TCP → Puerto específico: `8000`.
4. Acción: **Permitir la conexión**.
5. Perfil: marca **Privado** (red local).
6. Nombre: `Gestor IA`.

---

## 6. IP fija para el servidor (recomendado)

Para que la dirección no cambie al reiniciar, reserva la IP en el router:

1. Accede al panel de tu router (normalmente `192.168.1.1`).
2. Busca **DHCP → Reserva de dirección / Asignación estática**.
3. Añade la MAC del servidor → IP fija (p. ej. `192.168.1.50`).

---

## 7. Primer uso

### Acceso administrador

```
http://IP-SERVIDOR:8000/admin
```

Contraseña: la que pusiste en `.env` como `ADMIN_PASSWORD`.

### Acceso usuarios

```
http://IP-SERVIDOR:8000
```

Usuarios y contraseñas se crean desde el panel de administración.

---

## 8. Modelos disponibles

En el admin puedes asignar un modelo distinto a cada sección:

| Modelo | Velocidad | Coste | Mejor para |
|--------|-----------|-------|------------|
| `gpt-4o` | Media | Medio | Análisis de documentos, pólizas, siniestros |
| `gpt-4o-mini` | Rápida | Bajo | Redacciones simples, respuestas cortas |
| `o3-mini` | Media | Medio | Razonamiento complejo, comparativas |
| `o1-mini` | Lenta | Alto | Análisis muy detallados |
| `gpt-4-turbo` | Media | Medio | Alternativa a gpt-4o |
| `gpt-3.5-turbo` | Muy rápida | Muy bajo | Tareas sencillas, bajo coste |

> **Recomendación:** Usa `gpt-4o` para las secciones de análisis y `gpt-4o-mini` para redacciones.

---

## 9. Actualizar la aplicación

```batch
cd C:\gestor-prompts

REM Copia los nuevos archivos

REM Si hubo cambios en el frontend:
cd frontend
npm install
npm run build
cd ..

REM Reinicia el servicio (si usas NSSM):
net stop GestorIA
net start GestorIA

REM O simplemente cierra y vuelve a abrir iniciar.bat
```

---

## 10. Backup de datos

Toda la información se guarda en:

```
C:\gestor-prompts\gestor_prompts.db    ← base de datos (secciones, usuarios, logs)
C:\gestor-prompts\data\consultas\      ← consultas y respuestas guardadas
```

Copia de seguridad rápida (CMD):

```batch
xcopy C:\gestor-prompts\gestor_prompts.db C:\Backups\ /Y
xcopy C:\gestor-prompts\data\ C:\Backups\data\ /E /Y
```

Programa una tarea en **Programador de tareas de Windows** para que se ejecute diariamente.

---

## 11. Solución de problemas

| Problema | Causa probable | Solución |
|----------|----------------|----------|
| Pantalla en blanco | Frontend no compilado | `cd frontend && npm run build` |
| `OPENAI_API_KEY no configurada` | Falta el .env | Editar `.env` con la API Key |
| `Error: invalid_api_key` | Clave incorrecta o sin crédito | Verificar en platform.openai.com |
| No conecta desde otro equipo | Firewall bloqueando | Ver sección 5 |
| La IP cambia cada día | DHCP dinámico | Reservar IP en el router (sección 6) |
| `Address already in use` | Puerto ocupado | `netstat -ano \| findstr :8000` y matar el proceso |
| App no arranca tras actualizar | Dependencias nuevas | `pip install -r requirements.txt` |
| El i3 va lento al procesar | Petición pesada a OpenAI | Normal — el procesamiento es en la nube |

---

## 12. Acceso desde fuera de la red local (opcional)

Si necesitas acceder desde fuera de la oficina:

- **Tailscale** (recomendado): VPN gratuita, instala en el servidor y en los equipos remotos. Sin abrir puertos.
- **Cloudflare Tunnel**: expone la app con HTTPS sin abrir puertos en el router.

> No expongas el puerto 8000 directamente a Internet sin HTTPS adicional.
