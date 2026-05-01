$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'

$baseDir = Join-Path (Resolve-Path (Join-Path $PSScriptRoot '..\..')) 'refs\kenney'
New-Item -ItemType Directory -Force -Path $baseDir | Out-Null
Write-Host "Target: $baseDir"

$slugs = @(
    # 2D sprites / kits
    'platformer-kit',
    'new-platformer-pack',
    'pixel-platformer',
    'pixel-shmup',
    'pixel-ui-pack',
    'shape-characters',
    'toon-characters',
    'tower-defense-kit',
    'space-shooter-extension',
    'racing-pack',

    # UI / icons
    'ui-pack',
    'game-icons',
    'input-prompts',

    # VFX / textures
    'particle-pack',
    'prototype-textures',

    # Audio
    'impact-sounds',
    'interface-sounds',
    'ui-audio',
    'sci-fi-sounds',
    'rpg-audio',
    'voiceover-pack',
    'digital-audio',
    'music-jingles',

    # 3D
    'mini-dungeon',
    'modular-dungeon-kit',
    'modular-space-kit',
    'car-kit',
    'pirate-kit'
)

$results = @()
$i = 0
foreach ($slug in $slugs) {
    $i++
    $tag = "[$i/$($slugs.Count) $slug]"
    $dest = Join-Path $baseDir "kenney_$slug.zip"

    if (Test-Path $dest) {
        $sz = (Get-Item $dest).Length
        Write-Host "$tag SKIP (exists, $([math]::Round($sz/1MB,1)) MB)"
        $results += [PSCustomObject]@{ slug=$slug; status='skip'; bytes=$sz }
        continue
    }

    try {
        $page = Invoke-WebRequest -Uri "https://kenney.nl/assets/$slug" -UseBasicParsing -TimeoutSec 30
        $allMatches = [regex]::Matches($page.Content, "https://kenney\.nl/media/pages/assets/[^`"'<>\s]+?\.zip")
        $zipUrl = $allMatches | ForEach-Object { $_.Value } | Where-Object { $_ -match '/kenney_' } | Select-Object -First 1
        if ($zipUrl) {
            Write-Host "$tag GET $zipUrl"
            Invoke-WebRequest -Uri $zipUrl -OutFile $dest -UseBasicParsing -TimeoutSec 300
            $sz = (Get-Item $dest).Length
            Write-Host "$tag OK $([math]::Round($sz/1MB,1)) MB"
            $results += [PSCustomObject]@{ slug=$slug; status='ok'; bytes=$sz }
        } else {
            Write-Host "$tag NO-LINK (page exists but no zip URL found)"
            $results += [PSCustomObject]@{ slug=$slug; status='no-link'; bytes=0 }
        }
    } catch {
        $msg = if ($_.Exception.Response.StatusCode) { $_.Exception.Response.StatusCode.value__ } else { $_.Exception.Message }
        Write-Host "$tag FAIL $msg"
        $results += [PSCustomObject]@{ slug=$slug; status="fail:$msg"; bytes=0 }
    }

    Start-Sleep -Milliseconds 500
}

Write-Host ""
Write-Host "=== SUMMARY ==="
$results | Format-Table -AutoSize
$ok = $results | Where-Object status -in @('ok','skip')
$totalMB = [math]::Round((($ok | Measure-Object bytes -Sum).Sum) / 1MB, 1)
Write-Host "Total downloaded: $totalMB MB across $($ok.Count) packs"
$failed = $results | Where-Object { $_.status -notin @('ok','skip') }
if ($failed) {
    Write-Host ""
    Write-Host "Failed slugs (likely renamed or removed):"
    $failed | ForEach-Object { Write-Host "  $($_.slug) -> $($_.status)" }
}
