# Script PowerShell para agendar coleta de reputação a cada hora
# Execute como Administrador

# Caminhos
$scriptPath = "C:\Dev\Radar-Bank\scripts\run-reputation-cron.bat"
$taskName = "RadarBank-ReputationUpdate"

# Criar tarefa agendada
$action = New-ScheduledTaskAction -Execute $scriptPath
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date) -RepetitionInterval (New-TimeSpan -Hours 1)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

# Registrar tarefa
Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Description "Atualiza dados de reputação do Reclame Aqui a cada hora"

Write-Host "✅ Tarefa agendada criada com sucesso!" -ForegroundColor Green
Write-Host "Nome da tarefa: $taskName" -ForegroundColor Cyan
Write-Host "Executará a cada 1 hora" -ForegroundColor Cyan
Write-Host "" 
Write-Host "Para visualizar: Abra o Agendador de Tarefas (Task Scheduler)" -ForegroundColor Yellow
Write-Host "Para desabilitar: " -ForegroundColor Yellow
Write-Host "  Disable-ScheduledTask -TaskName '$taskName'" -ForegroundColor Gray
Write-Host "Para remover: " -ForegroundColor Yellow
Write-Host "  Unregister-ScheduledTask -TaskName '$taskName' -Confirm:`$false" -ForegroundColor Gray
