# Script PowerShell para agendar coleta REAL do Reclame Aqui
# Execute como Administrador
# Executa 3x ao dia: 8h, 14h, 20h

$scriptPath = "C:\Dev\Radar-Bank\scripts\run-reputation-real.bat"
$taskBaseName = "RadarBank-ReputationReal"

Write-Host "╔══════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                                      ║" -ForegroundColor Cyan
Write-Host "║      CONFIGURAR COLETA REAL DO RECLAME AQUI (3x ao dia)             ║" -ForegroundColor Cyan
Write-Host "║                                                                      ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar se está rodando como administrador
$currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
$isAdmin = $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $isAdmin) {
    Write-Host "❌ ERRO: Este script precisa ser executado como Administrador!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Clique com botão direito no PowerShell e selecione 'Executar como Administrador'" -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Remover tarefas antigas se existirem
Write-Host "🧹 Removendo tarefas antigas (se existirem)..." -ForegroundColor Yellow
Get-ScheduledTask -TaskName "$taskBaseName*" -ErrorAction SilentlyContinue | Unregister-ScheduledTask -Confirm:$false

Write-Host "✅ Limpeza concluída" -ForegroundColor Green
Write-Host ""

# Criar 3 tarefas agendadas (uma para cada horário)
$times = @(
    @{Hour=8; Minute=0; Name="Morning"},
    @{Hour=14; Minute=0; Name="Afternoon"},
    @{Hour=20; Minute=0; Name="Evening"}
)

foreach ($time in $times) {
    $taskName = "$taskBaseName-$($time.Name)"
    $triggerTime = New-ScheduledTaskTrigger -Daily -At "$($time.Hour):$($time.Minute)"
    
    $action = New-ScheduledTaskAction -Execute $scriptPath
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -MultipleInstances IgnoreNew
    
    $principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest
    
    Register-ScheduledTask `
        -TaskName $taskName `
        -Action $action `
        -Trigger $triggerTime `
        -Settings $settings `
        -Principal $principal `
        -Description "Coleta REAL de dados do Reclame Aqui às $($time.Hour)h" | Out-Null
    
    Write-Host "✅ Tarefa criada: $taskName (às $($time.Hour):00)" -ForegroundColor Green
}

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✨ CONFIGURAÇÃO CONCLUÍDA COM SUCESSO!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "📅 Horários de Execução:" -ForegroundColor Yellow
Write-Host "   • 08:00 - Manhã" -ForegroundColor White
Write-Host "   • 14:00 - Tarde" -ForegroundColor White
Write-Host "   • 20:00 - Noite" -ForegroundColor White
Write-Host ""
Write-Host "📂 Logs salvos em:" -ForegroundColor Yellow
Write-Host "   C:\Dev\Radar-Bank\logs\reputation-real.log" -ForegroundColor White
Write-Host ""
Write-Host "🔍 Para verificar tarefas:" -ForegroundColor Yellow
Write-Host "   1. Abra o 'Agendador de Tarefas' (Task Scheduler)" -ForegroundColor White
Write-Host "   2. Procure por tarefas com nome '$taskBaseName-*'" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Para testar agora (manual):" -ForegroundColor Yellow
Write-Host "   npx tsx scripts/update-reputation-real.ts" -ForegroundColor White
Write-Host ""
Write-Host "⚙️  Para desabilitar:" -ForegroundColor Yellow
Write-Host "   Disable-ScheduledTask -TaskName '$taskBaseName-*'" -ForegroundColor Gray
Write-Host ""
Write-Host "🗑️  Para remover:" -ForegroundColor Yellow
Write-Host "   Unregister-ScheduledTask -TaskName '$taskBaseName-*' -Confirm:`$false" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Pressione qualquer tecla para sair..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
