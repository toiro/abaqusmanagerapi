import { getStdout } from '../PowerShellRemote.js';

export default function sendFile(node, source, dest) {
  return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(source, dest));
}

const build = (source, dest) => `{
  param ($Session)
  Copy-Item –Path '${source}' –Destination '${dest}' –ToSession $Session -Force -Recurse
}`;
