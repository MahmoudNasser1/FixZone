@echo off
setlocal

REM Script to run the seed_data.sql file on the XAMPP MySQL server.

REM Configuration
set MYSQL_PATH="C:\xampp\mysql\bin\mysql.exe"
set DB_USER=root
set DB_NAME=FZ
set SCRIPT_PATH="database\seed_data.sql"

REM --- DO NOT EDIT BELOW THIS LINE ---

echo ==========================================================
echo           Fix Zone ERP - Database Seeding Tool
echo ==========================================================
echo.
echo This script will execute the seed data SQL file to populate your database.
echo Database: %DB_NAME%
echo Script:   %SCRIPT_PATH%
echo.

:CONFIRM
set /p "confirm=Are you sure you want to proceed? (Y/N): "
if /i "%confirm%"=="Y" goto :RUN_SCRIPT
if /i "%confirm%"=="N" goto :CANCEL
echo Invalid input. Please enter Y or N.
goto :CONFIRM

:RUN_SCRIPT
echo.
echo --- Running SQL Script... ---

REM Check if mysql.exe exists
if not exist %MYSQL_PATH% (
    echo.
    echo ERROR: MySQL executable not found at %MYSQL_PATH%.
    echo Please check your XAMPP installation path and update the MYSQL_PATH variable in this script.
    goto :END
)

REM Execute the script
%MYSQL_PATH% -u %DB_USER% %DB_NAME% < %SCRIPT_PATH%

if %errorlevel% neq 0 (
    echo.
    echo ERROR: The SQL script failed to execute. 
    echo Please check the error messages above.
    echo Common issues:
    echo 1. MySQL server is not running in XAMPP.
    echo 2. The database '%DB_NAME%' does not exist (run `run_database_script.bat` first).
    echo 3. Incorrect MySQL user ('%DB_USER%') or password required.
) else (
    echo.
    echo --- SUCCESS! --- 
    echo The database has been populated with seed data successfully.
)

goto :END

:CANCEL
echo.
echo Operation cancelled by user.
goto :END

:END
echo.
echo ==========================================================
pause
