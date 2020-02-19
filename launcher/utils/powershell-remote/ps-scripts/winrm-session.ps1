param(
  [string]$Hostname,
  [string]$UserName,
  [string]$EncirptedPassword,
  [string]$Command
)

$decripted = ConvertTo-SecureString $EncirptedPassword
$credential = New-Object System.Management.Automation.PsCredential($username, $decripted)

$session = New-PSSession -ComputerName $Hostname -Credential $credential
try {
  #$sb = [scriptblock]::Create("{&${Command} `$session}")
  $sb = [scriptblock]::Create($Command)
  Invoke-Command -ScriptBlock {.$sb $session};
} finally {
  Remove-PSSession -Session $session
}
