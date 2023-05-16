param (
  [String[]] $Path
)

if ($Path.Count -eq 0) {
  return 
}

return Test-Path $Path