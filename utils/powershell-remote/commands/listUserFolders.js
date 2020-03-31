import { getJSON } from '../PowerShellRemote.js';

export default async function listUserFolders(node, configFileName) {
  return getJSON(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(node.importDirectoryRoot, configFileName));
}

const build = (path, configFileName) => `{
  param ($Session)
   Invoke-Command -Session $Session -ScriptBlock  {
     $path = '${path}'
     if (-not $(Test-Path $path)) {
       return ConvertTo-Json @{ directories = @() }
     }
     $list = Get-ChildItem -Path $path -Directory | ForEach-Object -Begin { $ret = @() } {
       $owner = $_.Name
       $ret += $(Get-ChildItem $_.PsPath -Directory | ForEach-Object {
         @{
           owner = $owner;
           name = $_.Name;
           path = $_.PsPath -replace '^Microsoft.PowerShell.Core\\\\FileSystem::', '';
           config = $(Get-ChildItem -Path $_.PsPath -Filter '${configFileName}' | ForEach-Object { $(Get-Content $_.PsPath) -Join '\n' });
         }
       })
     } -End {
       return $ret
     }
     return ConvertTo-Json @{ directories = @($list) }
   }
 }`;
