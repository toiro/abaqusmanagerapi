import path from 'path';
import type { INode } from 'model/node.js';
import type { IJob } from 'model/job.js';
import { getStdout, getJSON } from '../PowerShellRemote.js';

type Args = (string | number)[];

const scriptDirectory = path.join(process.cwd(), 'resources/ps-scripts');
// const scriptDirectory = 'D:\\Nodes\\PowershellTest\\powershell-remote\\commands\\ps-scripts';
function build(commandScript: string, ...args: Args) {
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
export async function findFiles(node: INode, scriptPath: string, filter: string) {
  return getJSON(
    node.hostname,
    node.winrmCredential.user,
    node.winrmCredential.encryptedPassword,
    build('findFiles.ps1', scriptPath, filter)
  );
}

export async function getContentFromRemote(node: INode, scriptPath: string, max = 100) {
  return getStdout(
    node.hostname,
    node.winrmCredential.user,
    node.winrmCredential.encryptedPassword,
    build('getContentFromRemote.ps1', scriptPath, max)
  );
}

export async function moveDirectory(node: INode, sorceDir: string, destDir: string, newName = '') {
  return getStdout(
    node.hostname,
    node.winrmCredential.user,
    node.winrmCredential.encryptedPassword,
    build('moveDirectory.ps1', sorceDir, destDir, newName)
  );
}

export async function sendFile(node: INode, source: string, dest: string) {
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

export interface DslsStat {
  Licenses: DslsStatLicense[];
}

export interface DslsStatLicense {
  Feature: string;
  Version: string;
  Model: string;
  Type: string;
  Number: string;
  InUse: string;
  Expires: string;
  ServerName: string;
  CustomerID: string;
}

// procedure
export async function getDslsstat(node: INode) {
  return getJSON<DslsStat>(
    node.hostname,
    node.winrmCredential.user,
    node.winrmCredential.encryptedPassword,
    build('getDslsstat.ps1')
  );
}

export interface UserFolder {
  owner: string;
  name: string;
  path: string;
  config: string;
  inputfiles: string[];
}

export interface ListUserFolder {
  directories: UserFolder[];
}

export async function listUserFolders(node: INode, configFileName: string) {
  return (
    await getJSON<ListUserFolder>(
      node.hostname,
      node.winrmCredential.user,
      node.winrmCredential.encryptedPassword,
      build('listUserFolders.ps1', node.importDirectoryRoot, configFileName)
    )
  ).directories;
}

export async function setupInputFromSharedDirectory(
  node: INode,
  sorceDir: string,
  workingDir: string,
  inputfileName: string,
  newName = ''
) {
  return getStdout(
    node.hostname,
    node.winrmCredential.user,
    node.winrmCredential.encryptedPassword,
    build('setupInputFromSharedDirectory.ps1', sorceDir, workingDir, inputfileName, newName)
  );
}

export function terminateAbaqusJob(node: INode, job: IJob) {
  return getStdout(
    node.hostname,
    node.winrmCredential.user,
    node.winrmCredential.encryptedPassword,
    build('terminateAbaqusJob.ps1', job.status.executeDirectoryPath ?? '', job.name)
  );
}
