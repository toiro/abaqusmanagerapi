param(
  [Parameter(Mandatory=$true,ValueFromPipeline=$True)][string]$String
)

ConvertTo-SecureString $String -AsPlainText -Force | ConvertFrom-SecureString 
