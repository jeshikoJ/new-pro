@echo off
echo ===================================================
echo   Solar System Portfolio - Git Setup and Push
echo ===================================================
echo.

:: Check if git is installed in path
where git >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Git command was not found in your current environment PATH.
    echo.
    echo If you have Git installed, please:
    echo 1. Open Git Bash or VS Code in this directory:
    echo    c:\Users\USER\Downloads\new port
    echo 2. Run the following commands manually:
    echo.
    echo    git init
    echo    git add .
    echo    git commit -m "Initial commit - Interactive Solar System Portfolio"
    echo    git branch -M main
    echo    git remote add origin https://github.com/jeshikoJ/new-pro
    echo    git push -u origin main
    echo.
    pause
    exit /b
)

echo [INFO] Git detected. Initializing repository...
git init

echo [INFO] Adding files to git...
git add .

echo [INFO] Committing changes...
git commit -m "Initial commit - Interactive Solar System Portfolio"

echo [INFO] Setting branch name to main...
git branch -M main

echo [INFO] Setting remote repository origin...
git remote remove origin >nul 2>nul
git remote add origin https://github.com/jeshikoJ/new-pro

echo [INFO] Pushing files to GitHub...
echo Note: GitHub may prompt you to authenticate in a pop-up window.
echo.
git push -u origin main

echo.
echo ===================================================
echo   Completed! Please check your repository.
echo ===================================================
pause
