import { getStdout } from '../PowerShellRemote.js';

export default async function listUserFolders(node, sorceDir, destDir, newName = '') {
  return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(sorceDir, destDir, newName));
}

const build = (sorceDir, destDir, newName) => `{
  param ($Session)
  Invoke-Command -Session $Session -ScriptBlock  {
    $sourceDir = '${sorceDir}'
    $destDir = '${destDir}'
    $newName = '${newName}'
   
    if (-not $(Test-Path $destDir)) {
      New-Item $destDir -ItemType Directory > $null
    }
    $moved = Move-Item -Path $sourceDir -Destination $destDir -PassThru
   
    if ($newName) {
      Rename-Item $moved -NewName $newName
    }
  }
}`;
