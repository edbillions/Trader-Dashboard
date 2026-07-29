@echo off
cd /d "%~dp0"

echo ============================================
echo   Starting Trader Hub
echo ============================================
echo.

if not exist node_modules (
    echo Installing dependencies for the first time - this can take a few minutes...
    call npm install
    if errorlevel 1 (
        echo.
        echo Something went wrong installing dependencies.
        echo Please copy the text in this window and send it to Claude.
        pause
        exit /b 1
    )
)

if not exist .env (
    echo DATABASE_URL="file:./dev.db" > .env
)

echo Checking the database is up to date...
call npx prisma generate
if errorlevel 1 (
    echo.
    echo Something went wrong preparing the database.
    echo Please copy the text in this window and send it to Claude.
    pause
    exit /b 1
)
call npx prisma migrate deploy
if errorlevel 1 (
    echo.
    echo Something went wrong updating the database.
    echo Please copy the text in this window and send it to Claude.
    pause
    exit /b 1
)

echo Building the app...
call npm run build
if errorlevel 1 (
    echo.
    echo Something went wrong building the app.
    echo Please copy the text in this window and send it to Claude.
    pause
    exit /b 1
)

echo Starting the server...
start "Trader Hub Server - close this window to stop the app" cmd /k "npm start"

timeout /t 5 /nobreak >nul
start "" http://localhost:3000/dashboard

exit
