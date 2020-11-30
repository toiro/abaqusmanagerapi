param (
  [String] $Path,
  [String] $ConfigFileName
)
if (-not $(Test-Path $Path)) {
  return ConvertTo-Json @{ directories = @() }
}
$list = Get-ChildItem -Path $Path -Directory | ForEach-Object -Begin { $ret = @() } -Process {
    $owner = $_.Name
    $ret += $(Get-ChildItem $_.PsPath -Directory | ForEach-Object {
      @{
        owner = $owner;
        name = $_.Name;
        path = $_.Fullname;
        config = $(Get-ChildItem -Path $_.PsPath -Filter "$ConfigFileName" | ForEach-Object { $(Get-Content $_.PsPath) -Join '\n' });
        inputfiles = @($(Get-ChildItem -Path $_.PsPath -Filter '*.inp') | Foreach-Object { $_.Name });
      }
    })
  } -End { return $ret }
return ConvertTo-Json -InputObject @{ directories = @($list) } -Depth 3
