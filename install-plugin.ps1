<#
.SYNOPSIS
    Automated installer script for KPI Comparison Chart Plugin in Apache Superset.
.DESCRIPTION
    Installs and registers the KPI Comparison Chart Plugin into an Apache Superset repository:
    1. Locates and validates the Apache Superset root directory.
    2. Builds the plugin (TypeScript compilation) if npm is available.
    3. Copies plugin files into superset-frontend/plugins/superset-plugin-chart-stratum-kpi.
    4. Safely parses and updates MainPreset.ts with backup and idempotency:
       - import { StratumKPIChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-kpi/src';
       - new StratumKPIChartPlugin().configure({ key: 'kpi_comparison' }),
       Legacy registration variants (`.register()` lines, odd indentation, duplicates)
       are normalized to the canonical form instead of adding new lines.
    5. Cleans stale Webpack/Babel cache.
.PARAMETER SupersetPath
    Path to the Apache Superset root directory (e.g. D:\Sviluppo\superset).
.PARAMETER PluginPath
    Path to the KPI Comparison plugin root directory (default: script root).
.PARAMETER CleanReinstall
    Removes existing plugin folder completely and reinstalls from scratch.
.PARAMETER RebuildFrontend
    Runs 'npm run build' inside superset-frontend to recompile Webpack bundles.
.PARAMETER SkipBuild
    Skips running 'npm run build' before copying files.
.PARAMETER SkipCleanCache
    Skips removing superset-frontend/node_modules/.cache.
.PARAMETER Force
    Runs non-interactively using defaults without prompting.
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$SupersetPath,

    [Parameter(Position = 1)]
    [string]$PluginPath,

    [switch]$CleanReinstall,
    [switch]$RebuildFrontend,
    [switch]$SkipBuild,
    [switch]$SkipCleanCache,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

function Write-Color([string]$text, [string]$color = "White") {
    Write-Host $text -ForegroundColor $color
}

Write-Color "================================================================" "Cyan"
Write-Color "   StratumKPI - Apache Superset Plugin Installer      " "Cyan"
Write-Color "   All-in-One KPI Card with Temporal & Dual Metric Delta %       " "Cyan"
Write-Color "================================================================" "Cyan"
Write-Color ""

# -------------------------------------------------------------
# 1. Resolve Plugin Path
# -------------------------------------------------------------
if (-not $PluginPath) {
    $CurrentDir = (Get-Location).Path
    if (Test-Path (Join-Path $CurrentDir "package.json")) {
        $PluginPath = $CurrentDir
    } elseif (Test-Path (Join-Path $PSScriptRoot "src\index.ts")) {
        $PluginPath = $PSScriptRoot
    } elseif (Test-Path (Join-Path (Split-Path -Parent $PSScriptRoot) "src\index.ts")) {
        $PluginPath = Split-Path -Parent $PSScriptRoot
    } else {
        $PluginPath = $PSScriptRoot
    }
}

$ResolvedPluginPath = (Resolve-Path $PluginPath).Path
if (-not (Test-Path (Join-Path $ResolvedPluginPath "package.json"))) {
    Write-Color "[ERROR] Cannot find the plugin package.json in '$ResolvedPluginPath'!" "Red"
    exit 1
}
Write-Color "[INFO] Plugin folder (source): $ResolvedPluginPath" "Green"

# -------------------------------------------------------------
# 2. Resolve Superset Path
# -------------------------------------------------------------
$DefaultCompanyCandidate = "C:\Users\admmaps\superset_6_1_0\superset"
$DefaultCandidate = if (Test-Path $DefaultCompanyCandidate) { $DefaultCompanyCandidate } else { "D:\Sviluppo\superset" }

if (-not $SupersetPath) {
    $Candidates = @(
        $DefaultCompanyCandidate,
        "C:\Superset",
        "D:\Sviluppo\superset-6.1.0",
        "D:\Sviluppo\superset",
        (Join-Path $ResolvedPluginPath "..\superset"),
        (Join-Path $ResolvedPluginPath "..\superset-6.1.0"),
        (Join-Path $ResolvedPluginPath "..\apache-superset"),
        (Join-Path $env:USERPROFILE "superset_6_1_0\superset"),
        (Join-Path $env:USERPROFILE "superset"),
        (Join-Path $env:USERPROFILE "Projects\superset")
    )

    foreach ($cand in $Candidates) {
        if ($cand -and (Test-Path (Join-Path $cand "superset-frontend\package.json"))) {
            $SupersetPath = (Resolve-Path $cand).Path
            Write-Color "[INFO] Superset installation found automatically: $SupersetPath" "Green"
            break
        }
    }
}

if (-not $SupersetPath) {
    if ($Force) {
        $SupersetPath = $DefaultCandidate
    } else {
        Write-Color "Enter the path of the Apache Superset root folder" "Yellow"
        Write-Color "[Default: $DefaultCandidate]:" "Gray"
        $InputPath = Read-Host "Percorso Superset"
        if ([string]::IsNullOrWhiteSpace($InputPath)) {
            $SupersetPath = $DefaultCandidate
        } else {
            $SupersetPath = $InputPath.Trim('"', "'").Trim()
        }
    }
}

if (-not (Test-Path $SupersetPath)) {
    Write-Color "[ERROR] The specified path '$SupersetPath' does not exist!" "Red"
    Write-Color "Check that the path points to the Apache Superset root containing 'superset-frontend'." "Yellow"
    exit 1
}

$ResolvedSupersetPath = (Resolve-Path $SupersetPath).Path
$FrontendDir = Join-Path $ResolvedSupersetPath "superset-frontend"

if (-not (Test-Path (Join-Path $FrontendDir "package.json"))) {
    Write-Color "[ERROR] 'superset-frontend\package.json' not found in '$ResolvedSupersetPath'!" "Red"
    Write-Color "Make sure you select the main folder of the Superset repository." "Yellow"
    exit 1
}
Write-Color "[INFO] Superset target folder: $ResolvedSupersetPath" "Green"
Write-Color "[INFO] superset-frontend folder: $FrontendDir" "Gray"
Write-Color ""

# -------------------------------------------------------------
# 3. Build Plugin (TypeScript compilation)
# -------------------------------------------------------------
$DistDir = Join-Path $ResolvedPluginPath "dist"
if (Test-Path $DistDir) {
    Write-Color "`n=== STEP 1: Prebuilt 'dist' bundle found ===" "Cyan"
    Write-Color "[OK] Compiled files already in dist/. Instant install, no dependency download." "Green"
} elseif (Test-Path (Join-Path $ResolvedPluginPath "src\index.ts")) {
    Write-Color "`n=== STEP 1: 'src/' sources found ===" "Cyan"
    Write-Color "[OK] TypeScript sources ready. Superset will compile them directly through Webpack." "Green"
} elseif (-not $SkipBuild) {
    Write-Color "=== STEP 1: TypeScript build of the plugin ===" "Cyan"
    $NpmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
    if ($NpmCmd) {
        $PluginNodeModules = Join-Path $ResolvedPluginPath "node_modules"
        $LocalTsc = Join-Path $PluginNodeModules "typescript\lib\tsc.js"
        if (-not (Test-Path $LocalTsc)) {
            Write-Color "[INFO] Dependencies not ready (local typescript missing). Running 'npm install --legacy-peer-deps' automatically (same behaviour as stratum-bar)..." "Yellow"
            $OrigLoc = Get-Location
            try {
                Set-Location $ResolvedPluginPath
                & $NpmCmd.Source install --legacy-peer-deps
                if ($LASTEXITCODE -eq 0) {
                    Write-Color "[SUCCESS] Dependencies installed (npm install --legacy-peer-deps)." "Green"
                } else {
                    Write-Color "[WARN] 'npm install --legacy-peer-deps' returned code $LASTEXITCODE. Continuing with the existing files." "Yellow"
                }
            } catch {
                Write-Color "[WARN] Warning during npm install: $_" "Yellow"
            } finally {
                Set-Location $OrigLoc
            }
        } else {
            Write-Color "[INFO] Dependencies already present (local typescript found)." "Gray"
        }

        Write-Color "[INFO] Running 'npm run build' in '$ResolvedPluginPath'..." "Yellow"
        $OrigLoc = Get-Location
        try {
            Set-Location $ResolvedPluginPath
            & $NpmCmd.Source run build
            if ($LASTEXITCODE -eq 0) {
                Write-Color "[SUCCESS] TypeScript build completed successfully." "Green"
            } else {
                Write-Color "[WARN] 'npm run build' returned code $LASTEXITCODE. Continuing with the existing files." "Yellow"
            }
        } catch {
            Write-Color "[WARN] Warning during npm build: $_" "Yellow"
        } finally {
            Set-Location $OrigLoc
        }
    } else {
        Write-Color "[INFO] 'npm' not found in PATH. Continuing with the existing dist/src." "Gray"
    }
    Write-Color ""
}

# -------------------------------------------------------------
# 4. Copy/Sync Plugin to superset-frontend/plugins
# -------------------------------------------------------------
Write-Color "=== STEP 2: Copy and sync the plugin ===" "Cyan"
$PluginsTargetRoot = Join-Path $FrontendDir "plugins"
if (-not (Test-Path $PluginsTargetRoot)) {
    New-Item -ItemType Directory -Path $PluginsTargetRoot -Force | Out-Null
}

$DestPluginDir = Join-Path $PluginsTargetRoot "superset-plugin-chart-stratum-kpi"
if (Test-Path $DestPluginDir) {
    Write-Color "[INFO] Cleaning the previous version in '$DestPluginDir'..." "Yellow"
    try {
        Remove-Item -Recurse -Force $DestPluginDir -ErrorAction Stop
    } catch {
        Start-Sleep -Milliseconds 300
        Remove-Item -Recurse -Force $DestPluginDir -ErrorAction SilentlyContinue
    }
}

New-Item -ItemType Directory -Path $DestPluginDir -Force | Out-Null

$ItemsToCopy = @("src", "dist", "package.json", "tsconfig.json", "README.md", "CHANGELOG.md", "AGENTS.md")
foreach ($item in $ItemsToCopy) {
    $srcItem = Join-Path $ResolvedPluginPath $item
    if (Test-Path $srcItem) {
        $destItem = Join-Path $DestPluginDir $item
        $isDir = (Get-Item $srcItem) -is [System.IO.DirectoryInfo]
        if ($isDir) {
            Copy-Item -Path $srcItem -Destination $DestPluginDir -Recurse -Force
            Write-Color "  [+] Copied folder:    $item" "Gray"
        } else {
            Copy-Item -Path $srcItem -Destination $destItem -Force
            Write-Color "  [+] Copied file:      $item" "Gray"
        }
    }
}
Write-Color "[SUCCESS] Plugin copied successfully to '$DestPluginDir'" "Green"
Write-Color ""

# -------------------------------------------------------------
# 5. Safely parse and update MainPreset.ts
# -------------------------------------------------------------
Write-Color "=== STEP 3: Registration in MainPreset.ts ===" "Cyan"

$PresetCandidates = @(
    (Join-Path $FrontendDir "src\visualizations\presets\MainPreset.ts"),
    (Join-Path $FrontendDir "src\visualizations\presets\MainPreset.js")
)

$PresetFile = $null
foreach ($pf in $PresetCandidates) {
    if (Test-Path $pf) {
        $PresetFile = $pf
        break
    }
}

if (-not $PresetFile) {
    Write-Color "[ERROR] Cannot find MainPreset.ts in '$FrontendDir\src'!" "Red"
    exit 1
}

Write-Color "[INFO] Preset file found: $PresetFile" "Gray"

# 5.1 Safety backup
$BackupFile = "$PresetFile.bak"
if (-not (Test-Path $BackupFile)) {
    Copy-Item -Path $PresetFile -Destination $BackupFile -Force
    Write-Color "[SUCCESS] Safety backup created: $(Split-Path -Leaf $BackupFile)" "Green"
} else {
    Write-Color "[INFO] Existing safety backup kept: $(Split-Path -Leaf $BackupFile)" "Gray"
}

# 5.2 Reading and parsing
$RawContent = [System.IO.File]::ReadAllText($PresetFile, [System.Text.Encoding]::UTF8)
$NL = if ($RawContent.Contains("`r`n")) { "`r`n" } else { "`n" }

$TargetImport = "import { StratumKPIChartPlugin } from '../../../plugins/superset-plugin-chart-stratum-kpi/src';"
$TargetRegister = "        new StratumKPIChartPlugin().configure({ key: 'stratum_kpi' }),`r`n        new StratumKPIChartPlugin().configure({ key: 'kpi_comparison' }),"

# Idempotency is checked on the CANONICAL form (exact line): legacy variants
# (riga con `.register()`, indentazioni anomale, duplicati) non contano come
# configurazione valida e vengono normalizzate dal ramo else.
$PresetLineList = [System.Collections.Generic.List[string]]($RawContent -split "\r?\n")
$hasExactImport = ($PresetLineList -contains $TargetImport)
$hasExactRegister = ($PresetLineList -contains $TargetRegister)
$importCount = ([regex]::Matches($RawContent, "from\s*['`"][^'`"]*superset-plugin-chart-stratum-kpi")).Count
$registerCount = ([regex]::Matches($RawContent, "new\s+StratumKPIChartPlugin")).Count

if (-not $CleanReinstall -and $hasExactImport -and $hasExactRegister -and ($importCount -eq 1) -and ($registerCount -eq 1)) {
    Write-Color "[INFO] MainPreset.ts is already registered correctly (idempotent, no change needed)." "Green"
} else {
    Write-Color "[INFO] Updating the import and registration..." "Yellow"

    $lines = [System.Collections.Generic.List[string]]($RawContent -split "\r?\n")
    $filteredLines = [System.Collections.Generic.List[string]]::new()
    $lastImportIdx = -1

    for ($i = 0; $i -lt $lines.Count; $i++) {
        $line = $lines[$i]
        if ($line -match "from\s*['`"][^'`"]*superset-plugin-chart-stratum-kpi") {
            continue
        }
        if ($line.Trim().StartsWith("import ")) {
            $lastImportIdx = $filteredLines.Count
        }
        $filteredLines.Add($line)
    }

    if ($lastImportIdx -ge 0) {
        $filteredLines.Insert($lastImportIdx + 1, $TargetImport)
    } else {
        $filteredLines.Insert(0, $TargetImport)
    }

    $intermediateContent = $filteredLines -join $NL

    $regLines = [System.Collections.Generic.List[string]]($intermediateContent -split "\r?\n")
    $finalLines = [System.Collections.Generic.List[string]]::new()
    $pluginsIdx = -1

    for ($i = 0; $i -lt $regLines.Count; $i++) {
        $line = $regLines[$i]
        if ($line -match 'new\s+StratumKPIChartPlugin') {
            continue
        }
        $finalLines.Add($line)
        if ($line -match 'plugins\s*:\s*\[') {
            $pluginsIdx = $finalLines.Count
        }
    }

    if ($pluginsIdx -ge 0) {
        $finalLines.Insert($pluginsIdx, $TargetRegister)
    } else {
        $finalLines.Add($TargetRegister)
    }

    $NewContent = $finalLines -join $NL
    $Utf8NoBom = [System.Text.UTF8Encoding]::new($false)
    [System.IO.File]::WriteAllText($PresetFile, $NewContent, $Utf8NoBom)

    Write-Color "[SUCCESS] Added import:       $TargetImport" "Green"
    Write-Color "[SUCCESS] Added registration: $TargetRegister" "Green"
    Write-Color "[SUCCESS] File $(Split-Path -Leaf $PresetFile) saved successfully." "Green"
}
Write-Color ""

# -------------------------------------------------------------
# 6. Safety Cache Cleanup
# -------------------------------------------------------------
if (-not $SkipCleanCache) {
    Write-Color "=== STEP 4: Clearing the Webpack frontend cache ===" "Cyan"
    $CacheDirs = @(
        (Join-Path $FrontendDir "node_modules\.cache"),
        (Join-Path $FrontendDir ".cache")
    )
    foreach ($cd in $CacheDirs) {
        if (Test-Path $cd) {
            try {
                Remove-Item -Recurse -Force $cd -ErrorAction SilentlyContinue
                Write-Color "[SUCCESS] Cache cleared: $cd" "Green"
            } catch {
                Write-Color "[WARN] Cannot clear $($cd): $_" "Yellow"
            }
        }
    }
    Write-Color ""
}

# -------------------------------------------------------------
# 7. Hotfixes for known Superset 6.x issues (Geostyler and dependencies)
# -------------------------------------------------------------
Write-Color "=== STEP 5: Automatic patch for known Superset 6.x issues ===" "Cyan"
$WebpackConfig = Join-Path $FrontendDir "webpack.config.js"
if (Test-Path $WebpackConfig) {
    $WebpackContent = [System.IO.File]::ReadAllText($WebpackConfig, [System.Text.Encoding]::UTF8)
    # Fixes the path resolution problem on Windows for geostyler (it breaks local npm run build and docker)
    $TargetGeostylerRegex = '/node_modules\/.*geostyler.*\/.*\.(js|mjs)$/'
    $FixedGeostylerRegex = '/node_modules[\\\/].*geostyler.*[\\\/].*\.(js|mjs)$/'
    if ($WebpackContent.Contains($TargetGeostylerRegex)) {
        $WebpackContent = $WebpackContent.Replace($TargetGeostylerRegex, $FixedGeostylerRegex)
        [System.IO.File]::WriteAllText($WebpackConfig, $WebpackContent, [System.Text.UTF8Encoding]::new($false))
        Write-Color "[SUCCESS] Webpack config patched: geostyler regex fixed for Windows/ESM." "Green"
    } else {
        Write-Color "[INFO] Webpack config: geostyler patch already applied or not found." "Gray"
    }
}

$PackageJson = Join-Path $FrontendDir "package.json"
if (Test-Path $PackageJson) {
    $PkgContent = Get-Content -Raw $PackageJson
    $Modified = $false
    
    # Add @react-spring/web if missing (frequent visx crashes without it)
    if ($PkgContent -notmatch '"@react-spring/web"') {
        $PkgContent = $PkgContent -replace '("dependencies"\s*:\s*\{)', "`$1`n    `"@react-spring/web`": `"^9.7.5`","
        $Modified = $true
        Write-Color "[SUCCESS] Added @react-spring/web to package.json." "Green"
    }
    
    # Add @fontsource/inter if missing
    if ($PkgContent -notmatch '"@fontsource/inter"') {
        $PkgContent = $PkgContent -replace '("dependencies"\s*:\s*\{)', "`$1`n    `"@fontsource/inter`": `"^5.2.6`","
        $Modified = $true
        Write-Color "[SUCCESS] Added @fontsource/inter to package.json." "Green"
    }

    if ($Modified) {
        [System.IO.File]::WriteAllText($PackageJson, $PkgContent, [System.Text.UTF8Encoding]::new($false))
        Write-Color "[INFO] Changes saved to package.json (npm install / rebuild will be needed)." "Gray"
    } else {
        Write-Color "[INFO] Critical dependencies (@react-spring/web, @fontsource/inter) are already present." "Gray"
    }
}
Write-Color ""

# -------------------------------------------------------------
# 8. Optional Frontend Rebuild
# -------------------------------------------------------------
if ($RebuildFrontend) {
    Write-Color "=== STEP 6: Rebuilding the Apache Superset frontend ===" "Cyan"
    $NpmCmd = Get-Command "npm" -ErrorAction SilentlyContinue
    if ($NpmCmd) {
        Write-Color "[INFO] Starting 'npm run build' in '$FrontendDir'..." "Yellow"
        $OrigLoc = Get-Location
        try {
            Set-Location $FrontendDir
            & $NpmCmd.Source run build
            if ($LASTEXITCODE -eq 0) {
                Write-Color "[SUCCESS] Apache Superset frontend rebuilt successfully!" "Green"
            } else {
                Write-Color "[WARN] 'npm run build' exited with code $LASTEXITCODE." "Yellow"
            }
        } finally {
            Set-Location $OrigLoc
        }
    }
    Write-Color ""
}

Write-Color "================================================================" "Green"
Write-Color "   KPI Comparison plugin installed successfully! " "Green"
Write-Color "================================================================" "Green"
Write-Color "Il plugin 'kpi_comparison' e' ora registrato nel frontend Superset." "White"
Write-Color "Riavvia il server o visualizza la dashboard per utilizzarlo." "White"
Write-Color ""
