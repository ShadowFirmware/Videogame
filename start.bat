@echo off
title EducaRunner
echo.
echo  ================================================
echo       EDUCARUNNER - Videojuego Educativo
echo  ================================================
echo.

cd /d "%~dp0backend"

if not exist node_modules (
    echo  [1/2] Instalando dependencias por primera vez...
    echo        (esto solo ocurre la primera vez)
    echo.
    call npm install
    echo.
)

echo  [2/2] Iniciando servidor...
echo.
echo  Abre tu navegador en:
echo    http://localhost:3000         ^<-- Login de estudiantes
echo    http://localhost:3000/admin   ^<-- Panel de administrador
echo.
echo  Credenciales de administrador:
echo    Email:      admin@educarunner.com
echo    Contrasena: Admin1234
echo.
echo  Presiona Ctrl+C para detener el servidor.
echo  ================================================
echo.

start "" "http://localhost:3000"
npm start

pause
