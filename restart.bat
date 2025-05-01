@echo off
echo Restarting NovaFi applications...
node restart.js
echo Restarting backend server...
cd backend
node server.js
cd ..
pause