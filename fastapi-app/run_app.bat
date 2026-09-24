@echo off
title FastAPI App Launcher
color 0A
cd /d "%~dp0"
echo ===================================================
echo           FastAPI Local Server Launcher            
echo ===================================================
echo.
echo Starting FastAPI application...
echo App Dashboard : http://localhost:8000
echo Swagger Docs  : http://localhost:8000/docs
echo.
echo (Press CTRL+C or close this window anytime to stop the server)
echo ===================================================
echo.

python -m uvicorn main:app --reload --port 8000
pause
