$WshShell = New-Object -ComObject WScript.Shell
$Shortcut = $WshShell.CreateShortcut("$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\FastAPI-App.lnk")
$Shortcut.TargetPath = "python.exe"
$Shortcut.Arguments = "-m uvicorn main:app --port 8000"
$Shortcut.WorkingDirectory = "e:\Deepan\Linux\ansible\fastapi-app"
$Shortcut.WindowStyle = 7 # Minimized
$Shortcut.Save()
Write-Host "Startup shortcut created at $env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\FastAPI-App.lnk"
