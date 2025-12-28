@echo off
echo.
echo ========================================
echo   NEON INVADERS - Starting Dev Server
echo ========================================
echo.

REM Navigate to the correct directory
cd /d "%~dp0"

echo Current Directory: %CD%
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo [!] node_modules folder not found
    echo [*] Running npm install first...
    echo.
    call npm install
    echo.
)

REM Start the development server on port 8080
echo [*] Starting development server...
echo.
echo The game will open at: http://localhost:8080
echo.
echo Press Ctrl+C to stop the server when done.
echo.

call npm run dev -- --port 8080

pause
