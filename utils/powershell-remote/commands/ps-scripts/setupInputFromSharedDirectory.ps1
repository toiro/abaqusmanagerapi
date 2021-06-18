param (
  [String] $SourceDir,
  [String] $WorkingDir,
  [String] $InputfileName,
  [String] $NewName
)

# check inputfile existence.
$inputs = @($(Get-ChildItem $SourceDir -Filter '*.inp' | Foreach-Object { $_.Name }))
if (-not $inputs.Contains($InputfileName)) {
  throw "No input file: $InputfileName"
}

# make working dir if not exists.
if (-not $(Test-Path $WorkingDir)) {
  New-Item $WorkingDir -ItemType Directory > $null
}

if($inputs.Length -eq 1) {
  # move directory if input file is only one.
  Rename-Item $SourceDir -NewName $NewName -PassThru | Move-Item -Destination $WorkingDir
} else {
  # copy directory and move one input file if directory has multiple input files
  $tempDir = "${SourceDir}\..\${NewName}\"
  New-Item $tempDir -ItemType Directory > $null
  Move-Item -Path "${SourceDir}\${InputfileName}" -Destination $tempDir
  Get-ChildItem -Path $SourceDir -Exclude '*.inp' | Copy-Item -Destination $tempDir -Recurse
  Move-Item -Path $tempDir -Destination $WorkingDir
}
