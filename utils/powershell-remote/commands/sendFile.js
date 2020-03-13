import { getStdout } from '../PowerShellRemote.js';

export default function getContentFromRemote(node, path, max = 100) {
  return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(path, max));
}

const build = (source, dest) => `{
  param ($Session)
  Copy-Item –Path '${source}' –Destination '${dest}' –ToSession $Session -Force -Recurse
}`;
