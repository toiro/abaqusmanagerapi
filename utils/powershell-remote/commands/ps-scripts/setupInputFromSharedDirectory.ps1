param (
  [String] $SourceDir,
  [String] $WorkingDir,
  [String] $InputfileName,
  [String] $NewName
)

# inputfile があるか？
$inputs = @($(Get-ChildItem $SourceDir -Filter '*.inp' | Foreach-Object { $_.Name }))
if (-not $inputs.Contains($InputfileName)) {
  throw "No input file: $InputfileName"
}

# 作業ディレクトリがなければ作る
if (-not $(Test-Path $WorkingDir)) {
  New-Item $WorkingDir -ItemType Directory > $null
}

if($inputs.Length -eq 1) {
  # input が1つならディレクトリを移動する
  Rename-Item $SourceDir -NewName $NewName -PassThru | Move-Item -Destination $WorkingDir
} else {
  # input が複数なら元ディレクトリは残し、inputファイルだけ減らす
  $tempDir = "\${SourceDir}\\..\\\${NewName}\\"
  New-Item $tempDir -ItemType Directory > $null
  Move-Item -Path "\${SourceDir}\\\${InputfileName}" -Destination $tempDir
  Get-ChildItem -Path $SourceDir -Exclude '*.inp' | Copy-Item -Destination $tempDir -Recurse
  Move-Item -Path $tempDir -Destination $WorkingDir
}
