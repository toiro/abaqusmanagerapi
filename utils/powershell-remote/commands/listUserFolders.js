import { getJSON } from '../PowerShellRemote.js';

export default async function listUserFolders(node) {
  return getJSON(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(node.importDirectoryRoot));
}

const build = path => `{
  param ($Session)
   Invoke-Command -Session $Session -ScriptBlock  {
     $path = '${path}'
     $list = Get-ChildItem -Path $path -Directory | ForEach-Object -Begin { $ret = @() } {
       $owner = $_.Name
       $ret += $(Get-ChildItem $_.PsPath -Directory | ForEach-Object {
         @{
           owner = $owner;
           name = $_.Name;
           path = $_.PsPath -replace '^Microsoft.PowerShell.Core\\FileSystem::', ''
         }
       })
     } -End {
       return $ret
     }
     return ConvertTo-Json @{ directories = @($list) }
   }
 }`;
