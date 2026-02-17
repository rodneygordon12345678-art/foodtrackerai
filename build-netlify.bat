@echo off
REM Build Script for Netlify Secure Deployment

echo =============================================
echo FoodTrack AI - Netlify Secure Build
echo =============================================
echo.

echo This version is SECURE!
echo - API key hidden on server
echo - Uses Netlify Functions
echo - Safe to share publicly
echo.

if not exist "package.json" (
    echo [ERROR] Not in project directory!
    pause
    exit /b 1
)

echo [1/2] Installing dependencies...
echo (Including node-fetch for Netlify Functions)
call npm install
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] npm install failed!
    pause
    exit /b 1
)

echo.
echo [2/2] Building project...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] Build failed!
    pause
    exit /b 1
)

echo.
echo =============================================
echo SUCCESS! Ready for Netlify!
echo =============================================
echo.
echo IMPORTANT NEXT STEPS:
echo.
echo 1. Deploy to Netlify (see NETLIFY_SECURE_DEPLOYMENT.md)
echo    - Option A: Connect GitHub repo
echo    - Option B: Drag this entire folder
echo.
echo 2. Add Environment Variable in Netlify:
echo    - Go to Site configuration
echo    - Environment variables
echo    - Add: OPENROUTER_API_KEY = your-key-here
echo    - Redeploy!
echo.
echo 3. Test your app:
echo    - Try analyzing food
echo    - Check F12 DevTools - NO API KEY visible!
echo.
echo See NETLIFY_SECURE_DEPLOYMENT.md for details!
echo.

pause
