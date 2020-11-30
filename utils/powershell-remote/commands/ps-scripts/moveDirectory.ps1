Param(
  [String] $SourceDir,
  [String] $DestDir,
  [String] $NewName
)
  
# 移動先がなければ作る
if (-not $(Test-Path $DestDir)) {
  New-Item $DestDir -ItemType Directory > $null
}
$moved = Move-Item -Path $SourceDir -Destination $DestDir -PassThru
#返値はドライブをまたぐと移動先を追えない
   
if ($NewName) {
  Rename-Item "\$DestDir\\$($moved.Name)" -NewName $NewName
}
