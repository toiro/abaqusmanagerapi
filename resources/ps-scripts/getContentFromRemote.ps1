param (
  [String] $Path,
  [int] $Max
)

if (Test-Path $Path) {
  Get-Content -Tail $Max $Path
}
