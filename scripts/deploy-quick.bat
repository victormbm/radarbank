@echo off
echo ========================================
echo   BANCO SEGURO BR - DEPLOY RAPIDO
echo ========================================
echo.

echo [1/5] Verificando instalacao Vercel CLI...
where vercel >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Vercel CLI nao encontrado. Instalando...
    npm install -g vercel
) else (
    echo ✓ Vercel CLI ja instalado
)
echo.

echo [2/5] Gerando JWT Secret...
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('base64'))" > jwt_secret.txt
echo ✓ JWT Secret gerado em jwt_secret.txt
echo.

echo [3/5] Fazendo build local para testar...
call npm run build
if %ERRORLEVEL% NEQ 0 (
    echo ✗ Build falhou! Corrija os erros antes de fazer deploy.
    pause
    exit /b 1
)
echo ✓ Build OK
echo.

echo [4/5] Pronto para deploy!
echo.
echo PROXIMOS PASSOS:
echo 1. Crie banco de dados gratis em: https://neon.tech
echo 2. Copie a connection string
echo 3. Execute: vercel
echo 4. Configure as variaveis de ambiente no painel Vercel:
echo    - DATABASE_URL (do Neon)
echo    - JWT_SECRET (veja jwt_secret.txt)
echo    - NEXT_PUBLIC_APP_URL (URL do Vercel)
echo.
echo 5. Depois do deploy, acesse:
echo    - https://seu-app.vercel.app/api/ingest/bcb
echo    - https://seu-app.vercel.app/api/score/recompute (POST)
echo.

echo Deseja fazer deploy agora? (S/N)
set /p DEPLOY=
if /i "%DEPLOY%"=="S" (
    echo.
    echo Iniciando deploy...
    vercel --prod
) else (
    echo Deploy cancelado. Execute 'vercel --prod' quando estiver pronto.
)

pause
