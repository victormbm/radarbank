@echo off
REM Script para executar coleta de dados de reputação
REM Para agendar de hora em hora, use o Windows Task Scheduler

cd /d "%~dp0.."
echo [%date% %time%] Iniciando coleta de reputacao... >> logs\reputation-cron.log
call npx ts-node scripts\populate-reputation.ts >> logs\reputation-cron.log 2>&1
echo [%date% %time%] Coleta finalizada >> logs\reputation-cron.log
echo. >> logs\reputation-cron.log
