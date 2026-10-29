$WshShell = New-Object -ComObject WScript.Shell
$DesktopPath = [System.Environment]::GetFolderPath([System.Environment+SpecialFolder]::Desktop)
$Shortcut = $WshShell.CreateShortcut("$DesktopPath\FastAPI App.lnk")
$Shortcut.TargetPath = "e:\Deepan\Linux\ansible\fastapi-app\run_app.bat"
$Shortcut.WorkingDirectory = "e:\Deepan\Linux\ansible\fastapi-app"
$Shortcut.Save()
Write-Host "Desktop shortcut created successfully!"
