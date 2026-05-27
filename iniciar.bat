@echo off
title Gestor IA — Correduría de Seguros
cd /d "%~dp0"
call venv\Scripts\activate
echo.
echo  Gestor IA arrancando en http://localhost:8000
echo  Otros equipos: http://TU-IP:8000
echo  Pulsa Ctrl+C para detener.
echo.
uvicorn main:app --host 0.0.0.0 --port 8000
pause
