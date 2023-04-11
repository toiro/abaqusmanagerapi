Param(
  [String] $SourceDir,
  [String] $DestDir,
  [String] $NewName
)
  
# make dest if not exists
if (-not $(Test-Path $DestDir)) {
  New-Item $DestDir -ItemType Directory > $null
}
$moved = Move-Item -Path $SourceDir -Destination $DestDir -PassThru
# returned path can't be followed if drive letter is changed.
   
if ($NewName) {
  Rename-Item "\$DestDir\\$($moved.Name)" -NewName $NewName
}
