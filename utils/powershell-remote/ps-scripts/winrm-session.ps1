param(
  [string]$Hostname,
  [string]$UserName,
  [string]$EncirptedPassword,
  [string]$Command
)

$ErrorActionPreference = 'Stop'
try {
  $sb = [scriptblock]::Create($Command)

  # https://devblogs.microsoft.com/powershell/windows-security-change-affecting-powershell/
  # 上記問題を回避するため、ローカル実行は winRM を通さない
  # ちゃんとやれるなら JEA を構成する方が正しいかもしれない
  $session = & {
    if ($Hostname -eq 'localhost' -or $Hostname -eq $(hostname)) {
      return $null
    } else {
      $decripted = ConvertTo-SecureString $EncirptedPassword
      $credential = New-Object System.Management.Automation.PsCredential($username, $decripted)
      return New-PSSession -ComputerName $Hostname -Credential $credential
    }
  }

  Invoke-Command -ScriptBlock $sb -ArgumentList $session
} catch {
  exit 1
} finally {
  if (-not $session -eq $null) {
    Remove-PSSession -Session $session
  }
}
