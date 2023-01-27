import path from 'path';
import { getStdout, getJSON } from '../PowerShellRemote.js';
const scriptDirectory = path.join(process.cwd(), 'resources/ps-scripts');
// const scriptDirectory = 'D:\\Nodes\\PowershellTest\\powershell-remote\\commands\\ps-scripts';
function build(commandScript, ...args) {
    const commandPath = path.join(scriptDirectory, commandScript);
    const argsStr = args.map((arg) => (typeof arg === 'string' ? `"${arg}"` : arg)).join(' ');
    return `{
    param ($Session)
    $comstr = Get-Content "${commandPath}" -Raw
    $command = {
      param($sbstr)
      $sb = [ScriptBlock]::Create($sbstr)
      &$sb ${argsStr}
    }

    if ($Session) {
      Invoke-Command -Session $Session -ScriptBlock $command -ArgumentList $comstr
    } else {
      Invoke-Command -ScriptBlock $command -ArgumentList $comstr
    }
  }`;
}
// simple function
export async function findFiles(node, scriptPath, filter) {
    return getJSON(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build('findFiles.ps1', scriptPath, filter));
}
export async function getContentFromRemote(node, scriptPath, max = 100) {
    return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build('getContentFromRemote.ps1', scriptPath, max));
}
export async function moveDirectory(node, sorceDir, destDir, newName = '') {
    return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build('moveDirectory.ps1', sorceDir, destDir, newName));
}
export async function sendFile(node, source, dest) {
    // Copy-Item はそれ自体がセッションをパラメータとして受け取る
    const command = `{
    param ($Session)
    if ($Session) {
      Copy-Item –Path '${source}' –Destination '${dest}' –ToSession $Session -Force -Recurse
    } else {
      Copy-Item –Path '${source}' –Destination '${dest}' -Force -Recurse
    }
  }`;
    return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, command);
}
// procedure
export async function getDslsstat(node) {
    return getJSON(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build('getDslsstat.ps1'));
}
export async function listUserFolders(node, configFileName) {
    return getJSON(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build('listUserFolders.ps1', node.importDirectoryRoot, configFileName));
}
export async function setupInputFromSharedDirectory(node, sorceDir, workingDir, inputfileName, newName = '') {
    return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build('setupInputFromSharedDirectory.ps1', sorceDir, workingDir, inputfileName, newName));
}
export function terminateAbaqusJob(node, job) {
    return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build('terminateAbaqusJob.ps1', job.status.executeDirectoryPath, job.name));
}
