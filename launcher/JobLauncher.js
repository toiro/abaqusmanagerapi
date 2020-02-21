import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import dateformat from 'dateformat';
import PowerShellRemote from './utils/powershell-remote/PowerShellRemote.js';
import AbaqusCommandBuilder from './utils/powershell-remote/AbaqusCommandBuilder.js';

export default class JobLauncher extends EventEmitter {
  // constructor () {super();};
  launch(job) {
    try {
      launchJob(job, this);
    } catch (error) {
      this.emit('error', job.toObject(), error);
    }
  }
}

const datePostfixFormat = 'yyyymmddHHMMssl';
async function launchJob(job, emitter) {
  const datePostfix = dateformat(Date.now(), datePostfixFormat);
  const workingDirName = `${job.owner}_${job.name}_${datePostfix}`;
  const localTempDir = path.join(process.cwd(), 'temp');
  // ファイルを配置する
  const executeRootDir = 'C:\\Temp\\';

  let inputFileName = '';
  if (job.input.uploaded) {
    inputFileName = job.input.uploaded.fileName;
    // アップロードされたファイルを取得
    await fs.promises.mkdir(path.join(localTempDir, workingDirName));
    await fs.promises.writeFile(path.join(localTempDir, workingDirName, inputFileName), job.input.uploaded.content);
  } else if (job.input.sharedDirectoryPath) {
    // 共有ディレクトリから取得
    throw new Error('Not implemented yet');// TODO
  } else {
    throw new Error('No input file configuration');
  }

  // シェル起動は await しない
  const abaqusCommand = new AbaqusCommandBuilder();
  abaqusCommand
    .setJobName(job.name)
    .setFileName(inputFileName)
    .setCpus(job.command.cpus)
    .setSourceDir(localTempDir)
    .setDestinationDir(executeRootDir)
    .setWorkingDirName(workingDirName);
  const node = {
    hostname: 'UK-X',
    user: 'lab',
    password: 'encrypted'
  };
  const psRemote = new PowerShellRemote(node.hostname, node.user, node.password, abaqusCommand.build());
  psRemote
    .on('stdout', (data, count) => {})
    .on('stderr', data => {})
    .on('error', error => {
      emitter.emit('error', job.toObject(), error);
    })
    .on('finish', (code, lastStdOut) => {
      // TODO ファイルを結果ディレクトリに移動する
      const resultDir = '';
      emitter.emit('finish', job.toObject(), code, lastStdOut, resultDir);
    })
    .invoke();

  emitter.emit('launch', job.toObject(), path.join(executeRootDir, workingDirName));
};
