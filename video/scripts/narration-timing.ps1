# Timing check for narration.md: synthesise each line with Windows SAPI at
# about 150 words a minute and report whether it fits its slot. The SAPI
# voices are a guide track only; they are too robotic to ship.
#
#   powershell -ExecutionPolicy Bypass -File scripts/narration-timing.ps1 [-Wav]
#
# With -Wav it also writes assets/audio/narration-guide.wav (lines placed at
# their timecodes) for the presenter to rehearse against.
param([switch]$Wav)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$root = Split-Path -Parent $PSScriptRoot
$md = Get-Content (Join-Path $root 'narration.md') -Encoding UTF8
# Lines look like: | 0.0-5.6 | text | note |  (en dash or hyphen; this file stays ASCII
# because Windows PowerShell 5.1 reads BOM-less scripts as ANSI)
$rows = @()
foreach ($l in $md) {
  if ($l -match '^\|\s*(\d+(?:\.\d+)?)\s*\p{Pd}\s*(\d+(?:\.\d+)?)\s*\|\s*([^|]+?)\s*\|') {
    $rows += [pscustomobject]@{ From = [double]$matches[1]; To = [double]$matches[2]; Text = $matches[3] }
  }
}
if (-not $rows.Count) { throw 'no timed rows found in narration.md' }

$synth = New-Object System.Speech.Synthesis.SpeechSynthesizer
$synth.SelectVoice('Microsoft Zira Desktop')
$synth.Rate = 1
$fmt = New-Object System.Speech.AudioFormat.SpeechAudioFormatInfo(48000, [System.Speech.AudioFormat.AudioBitsPerSample]::Sixteen, [System.Speech.AudioFormat.AudioChannel]::Mono)
$tmp = Join-Path $root '.cache\narration'
New-Item -ItemType Directory -Force $tmp | Out-Null

$ok = $true
$i = 0
foreach ($r in $rows) {
  $i++
  # Spoken form: names as they sound.
  $say = $r.Text -replace 'Ay.e', 'Eye-sheh' -replace 'USDC', 'U S D C'
  $f = Join-Path $tmp ("line{0:D2}.wav" -f $i)
  $synth.SetOutputToWaveFile($f, $fmt)
  $synth.Speak($say)
  $synth.SetOutputToNull()
  $bytes = (Get-Item $f).Length - 44
  $secs = $bytes / (48000 * 2)
  $slot = $r.To - $r.From
  $words = ($r.Text -split '\s+').Count
  $fit = if ($secs -le $slot) { 'fits' } else { $ok = $false; 'TOO LONG' }
  '{0,5:N1}-{1,5:N1}  slot {2,4:N1}s  speech {3,4:N1}s  {4,3} words  {5}' -f $r.From, $r.To, $slot, $secs, $words, $fit
  $r | Add-Member -NotePropertyName File -NotePropertyValue $f
}

if ($Wav) {
  $out = Join-Path $root 'assets\audio'
  New-Item -ItemType Directory -Force $out | Out-Null
  $ff = $env:FFMPEG; if (-not $ff) { $ff = 'ffmpeg' }
  $inputs = @(); $filters = @(); $k = 0
  foreach ($r in $rows) {
    $inputs += @('-i', $r.File)
    $ms = [int]($r.From * 1000)
    $filters += "[$k]adelay=$ms|$ms[a$k]"
    $k++
  }
  $mix = ($filters -join ';') + ';' + ((0..($k - 1) | ForEach-Object { "[a$_]" }) -join '') + "amix=inputs=$($k):normalize=0,apad=whole_dur=60[out]"
  & $ff -y -loglevel error @inputs -filter_complex $mix -map '[out]' -t 60 -ar 48000 (Join-Path $out 'narration-guide.wav')
  "wrote assets/audio/narration-guide.wav"
}
if (-not $ok) { exit 1 }
