param(
  [String] $WorkingDir,
  [String] $JobName
)
Push-Location $WorkingDir
abaqus terminate job=${jobName}
Pop-Location
