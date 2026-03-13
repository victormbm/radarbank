@echo off
REM Script batch para executar coleta REAL do Reclame Aqui
REM Usado pelo Windows Task Scheduler

cd /d "%~dp0.."

REM Criar diretório de logs se não existir
if not exist "logs" mkdir logs

REM Adicionar timestamp ao log
echo ============================================ >> logs\reputation-real.log
echo [%date% %time%] Iniciando coleta REAL do Reclame Aqui... >> logs\reputation-real.log
echo ============================================ >> logs\reputation-real.log

REM Executar script de coleta
call npx tsx scripts\update-reputation-real.ts >> logs\reputation-real.log 2>&1

REM Adicionar timestamp de conclusão
echo [%date% %time%] Coleta finalizada >> logs\reputation-real.log
echo. >> logs\reputation-real.log
