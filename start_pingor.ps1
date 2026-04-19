# Launch Backend
Start-Process powershell -ArgumentList "-NoExit -Command `"cd server; npm start`""

# Launch Frontend
Start-Process powershell -ArgumentList "-NoExit -Command `"cd client; npm start`""

Write-Host "Pingor frontend and backend have been launched in separate windows."
