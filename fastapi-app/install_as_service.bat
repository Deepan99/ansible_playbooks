@echo off
:: Windows Service Installation Script using NSSM (Non-Sucking Service Manager)
:: Run this batch file as Administrator

cd /d "%~dp0"
echo Downloading NSSM...
powershell -Command "Invoke-WebRequest -Uri 'https://nssm.cc/release/nssm-2.24.zip' -OutFile 'nssm.zip'"
powershell -Command "Expand-Archive -Path 'nssm.zip' -DestinationPath 'nssm_temp' -Force"

copy "nssm_temp\nssm-2.24\win64\nssm.exe" "nssm.exe"
rmdir /s /q "nssm_temp"
del /f /q "nssm.zip"

echo Installing Windows Service 'FastAPIApp'...
nssm install FastAPIApp "%WHERE:python.exe%" "-m uvicorn main:app --host 0.0.0.0 --port 8000"
nssm set FastAPIApp AppDirectory "%CD%"
nssm set FastAPIApp Start SERVICE_AUTO_START
nssm start FastAPIApp

echo Done! FastAPIApp is now running as a permanent Windows Service.
pause
