@echo off
setlocal

:: Change to the script's directory
cd /d "%~dp0"

:: Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed. Please install Node.js first.
    echo Visit https://nodejs.org/ to download and install Node.js
    echo.
    pause
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo Failed to install dependencies.
    pause
    exit /b 1
)

:: Start the server
echo Starting server...
start /b cmd /c "npm start"

:: Wait for server to start (give it 2 seconds)
timeout /t 2 /nobreak >nul

:: Open the default browser
echo Opening browser...
start http://localhost:3000

:: Keep the window open and show instructions
echo.
echo Server is running. Close this window to stop the server.
echo.
pause 