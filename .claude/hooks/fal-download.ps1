$ErrorActionPreference = 'Stop'

try {
    $rawInput = [Console]::In.ReadToEnd()
    if ([string]::IsNullOrWhiteSpace($rawInput)) { exit 0 }

    $data = $rawInput | ConvertFrom-Json

    if ($data.tool_name -notlike 'mcp__fal-ai__*') { exit 0 }

    $pattern = 'https?://[a-zA-Z0-9.\-]*fal\.(?:media|run)/[^"\s\\]+'
    $urls = [regex]::Matches($rawInput, $pattern) | ForEach-Object { $_.Value } | Sort-Object -Unique

    if ($urls.Count -eq 0) { exit 0 }

    $projectRoot = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
    $downloadDir = Join-Path $projectRoot 'download'
    if (-not (Test-Path $downloadDir)) {
        New-Item -ItemType Directory -Path $downloadDir | Out-Null
    }

    $timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
    foreach ($url in $urls) {
        try {
            $uri = [Uri]$url
            $basename = [System.IO.Path]::GetFileName($uri.LocalPath)
            if ([string]::IsNullOrEmpty($basename)) { $basename = 'file.bin' }
            $dest = Join-Path $downloadDir "${timestamp}_${basename}"
            if (Test-Path $dest) { continue }
            Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 90
        } catch {
            [Console]::Error.WriteLine("fal-download: failed to fetch ${url}: $_")
        }
    }

    exit 0
} catch {
    [Console]::Error.WriteLine("fal-download hook error: $_")
    exit 0
}
