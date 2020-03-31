import { getJSON } from '../PowerShellRemote.js';

export default async function findFiles(node, path, filter) {
  return getJSON(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(path, filter));
}

const build = (path, filter) => `{
  param ($Session)
   Invoke-Command -Session $Session -ScriptBlock  {
     $path = '${path}'
     $filter = '${filter}'
     $ret = $(Get-ChildItem $path -FIlter $filter | ForEach-Object { $_.PsPath -replace '^Microsoft.PowerShell.Core\\\\FileSystem::', '' })
     return ConvertTo-Json @{ result = @($ret) }
   }
 }`;
