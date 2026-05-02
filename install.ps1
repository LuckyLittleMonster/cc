# cc-install (PowerShell 壳)
# 调用 scripts/install/install.js
# 用法见 scripts/install/README.md 或 .\install.ps1 --help

$ErrorActionPreference = 'Stop'

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$InstallJs = Join-Path $ScriptDir 'scripts/install/install.js'

# 检查 node 是否存在
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "错误：未找到 node。请安装 Node.js >= 18。" -ForegroundColor Red
    exit 1
}

# 检查 node 版本
$nodeVersion = (& node -v) -replace '^v', ''
$nodeMajor = [int]($nodeVersion.Split('.')[0])
if ($nodeMajor -lt 18) {
    Write-Host "错误：Node v$nodeVersion 太旧。需要 Node.js >= 18（util.parseArgs）。" -ForegroundColor Red
    exit 1
}

# 转发所有参数（PowerShell 自动展开 $args）
& node $InstallJs @args
exit $LASTEXITCODE
