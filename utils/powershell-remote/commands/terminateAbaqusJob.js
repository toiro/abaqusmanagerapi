import { getStdout } from '../PowerShellRemote.js';

export default function terminateAbaqusJob(node, job) {
  return getStdout(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, build(job.name, job.status.executeDirectoryPath));
}

const build = (jobName, workingDir) => `{
  param ($Session)
  Invoke-Command -Session $Session -ScriptBlock  {
    Push-Location '${workingDir}'
    abaqus terminate job=${jobName}
    Pop-Location
  }
}`;
