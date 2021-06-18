param (
  [String] $Path,
  [String] $Filter
)

$ret = $(Get-ChildItem $Path -Filter $Filter | ForEach-Object { $_.FullName })
return ConvertTo-Json @{ result = @($ret) }
