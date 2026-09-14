# Synchronise les skills corrigees vers .claude\skills (lu par Claude Code)
$src = "$env:USERPROFILE\Desktop\skills"
$dst = "$env:USERPROFILE\.claude\skills"
$bak = "$env:USERPROFILE\Desktop\skills-BACKUP-" + (Get-Date -Format "yyyyMMdd-HHmm")
if (Test-Path $dst) { Write-Host "Sauvegarde ->" $bak; Copy-Item $dst $bak -Recurse -Force }
robocopy $src $dst /E /XD "_plugins" /NFL /NDL /NJH /NJS | Out-Null
$n = (Get-ChildItem $dst -Directory).Count
Write-Host ""
Write-Host "OK. $n skills dans .claude\skills"
Write-Host "Verif baffled-bar :"
Select-String -Path "$dst\baffled-bar\SKILL.md" -Pattern "twenty percent" -SimpleMatch | Select-Object -First 1
Write-Host "Verif fusion-baffled :"
if (Test-Path "$dst\fusion-baffled\references\banque-complete.md") { Write-Host "  banque-complete.md OK" } else { Write-Host "  MANQUANT" }
Read-Host "Entree pour fermer"
