# One-command publish: validate all chapters, rebuild the bundle, commit, push (GitHub Pages redeploys automatically).
Set-Location $PSScriptRoot
foreach ($n in @('01','06','07','08','09','10','11','12')) { python tools/validate.py $n | Select-Object -Last 1 }
python tools/build.py
git add -A
git commit -m "Content update $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
git push
