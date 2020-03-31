param(
  [string]$Hostname,
  [string]$UserName,
  [string]$EncirptedPassword,
  [string]$Command
)

$ErrorActionPreference = 'Stop'
try {
  $decripted = ConvertTo-SecureString $EncirptedPassword
  $credential = New-Object System.Management.Automation.PsCredential($username, $decripted)
  $session = New-PSSession -ComputerName $Hostname -Credential $credential
  $sb = [scriptblock]::Create($Command)
  Invoke-Command -ScriptBlock {.$sb $session};
} catch {
  exit 1
} finally {
  if (-not $session -eq $null) {
    Remove-PSSession -Session $session
  }
}
