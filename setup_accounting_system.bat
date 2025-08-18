@echo off
setlocal ENABLEDELAYEDEXPANSION
rem Ensure working directory is the script's folder
pushd "%~dp0"
echo ========================================
echo    Fix Zone ERP - Accounting System Setup
echo ========================================
echo.

rem Locate MySQL executable
set "MYSQL_EXE="
for /f "delims=" %%I in ('where mysql 2^>nul') do set "MYSQL_EXE=%%I" & goto :foundPath

rem Fallback to common XAMPP path
if exist "C:\xampp\mysql\bin\mysql.exe" set "MYSQL_EXE=C:\xampp\mysql\bin\mysql.exe"

:foundPath
if not defined MYSQL_EXE (
  echo [ERROR] Could not find mysql.exe. Please ensure XAMPP is installed or add MySQL to PATH.
  echo Expected path: C:\xampp\mysql\bin\mysql.exe
  echo Alternatively, edit setup_accounting_system.bat and set MYSQL_EXE manually.
  exit /b 1
)

echo Using MySQL at: %MYSQL_EXE%
echo.

echo [1/6] Creating database FZ...
"%MYSQL_EXE%" -u root -p -e "CREATE DATABASE IF NOT EXISTS FZ CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

echo [2/6] Applying main database schema...
"%MYSQL_EXE%" -u root -p FZ < "%~dp0fixzone_erp_full_schema.sql"

echo [3/6] Creating accounting system...
"%MYSQL_EXE%" -u root -p FZ < "%~dp0migrations\2025-08-18_create_accounting_system.sql"

echo [4/6] Adding accounting seed data...
"%MYSQL_EXE%" -u root -p FZ < "%~dp0migrations\2025-08-18_accounting_seed_data.sql"

echo [5/6] Adding accounting integration...
"%MYSQL_EXE%" -u root -p FZ < "%~dp0migrations\2025-08-18_add_accounting_integration.sql"

echo [6/6] Adding main seed data...
"%MYSQL_EXE%" -u root -p FZ < "%~dp0database\seed_data.sql"

echo.
echo ========================================
echo    Setup completed successfully!
echo ========================================
echo.
echo Next steps:
echo 1. Run: node server.js
echo 2. Run: cd frontend/react-app ^&^& npm start
echo 3. Open: http://localhost:3001
echo.
popd
pause
