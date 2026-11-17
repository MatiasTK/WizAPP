# Signed release build: asks for the updater key password (hidden) and runs `pnpm build`.
# The key is read from $env:TAURI_SIGNING_PRIVATE_KEY (path or content) when set,
# otherwise from ~\.tauri\wizapp.key.
$ErrorActionPreference = 'Stop'

if (-not $env:TAURI_SIGNING_PRIVATE_KEY) {
    $keyPath = Join-Path $HOME '.tauri\wizapp.key'
    if (-not (Test-Path $keyPath)) {
        throw "Signing key not found at $keyPath. Set TAURI_SIGNING_PRIVATE_KEY or run: pnpm tauri signer generate -w $keyPath"
    }
    $env:TAURI_SIGNING_PRIVATE_KEY = Get-Content $keyPath -Raw
}

if (-not $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD) {
    $secure = Read-Host 'Signing key password' -AsSecureString
    $env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = [System.Net.NetworkCredential]::new('', $secure).Password
}

Set-Location (Split-Path -Parent $PSScriptRoot)
pnpm build
exit $LASTEXITCODE
