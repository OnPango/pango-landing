$ErrorActionPreference = 'Stop'
Set-Location (Join-Path $PSScriptRoot '..')
New-Item -ItemType Directory -Force validation-results | Out-Null
git rev-parse HEAD | Set-Content validation-results/commit.txt
pnpm install --frozen-lockfile 2>&1 | Tee-Object validation-results/install.txt
if ($LASTEXITCODE -ne 0) { throw 'Install failed' }
pnpm build 2>&1 | Tee-Object validation-results/build.txt
if ($LASTEXITCODE -ne 0) { throw 'Build failed' }
if (-not (Test-Path dist/index.html)) { throw 'Missing built home page' }
Write-Output 'Build and home-page artifact verified' | Tee-Object validation-results/smoke.txt
