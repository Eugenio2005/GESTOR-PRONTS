#!/bin/bash
# Arranca la aplicación en modo producción
# REQUISITO: compilar el frontend la primera vez y tras cada actualización:
#   cd frontend && npm install && npm run build && cd ..

cd "$(dirname "$0")"
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --port 8000
