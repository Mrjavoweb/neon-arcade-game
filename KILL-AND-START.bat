@echo off
echo.
echo ========================================
echo   NEON INVADERS - Clean Start
echo ========================================
echo.

REM Navigate to the correct directory
cd /d "%~dp0"

echo [*] Killing any running Node.js processes...
echo.
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [*] Clearing Vite cache...
echo.
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
    echo Cache cleared!
) else (
    echo No cache to clear.
)
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
echo [*] Starting fresh development server on port 8080...
echo.
echo ========================================
echo   Open your browser to:
echo   http://localhost:8080
echo ========================================
echo.
echo Press Ctrl+C to stop the server when done.
echo.

call npm run dev -- --port 8080 --host

pause

