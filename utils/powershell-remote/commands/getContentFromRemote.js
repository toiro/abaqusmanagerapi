import { getStdout } from '../PowerShellRemote.js';

export default function getContentFromRemote(node, path, max = 100) {
  return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(path, max));
}

const build = (path, max) => `{
  param ($Session)
  Invoke-Command -Session $Session -ScriptBlock  {
    $path = '${path}'
    if (Test-Path $path) {
      Get-Content -Tail ${max} $path
    }
  }
}`;
