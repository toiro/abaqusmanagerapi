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
  const executionRootDir = 'C:\\Temp\\';

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
    .setDestinationDir(executionRootDir)
    .setWorkingDirName(workingDirName);
  const node = {
    hostname: 'UK-X',
    user: 'lab',
    password: '01000000d08c9ddf0115d1118c7a00c04fc297eb01000000836fb6f7f4e3e546b49f3ae2f84deef80000000002000000000010660000000100002000000038a013847f52c76a43040875b52183468263e7317e3857e4dcbe58ef93dde8b2000000000e80000000020000200000002bbd62b7e1c68ed954883c77c3a0ee5a3422d641214872c99e0aceae42f9f41a2000000052091a80118f9fa3e3879d7e3ad831f2a676944f62d7f828984f1b0da80c92b040000000ae939d2d8d3ed69fcba342fd81a3dde40de3aabdd204c386286873edb0b7bfb3d4a7c8f15d5a362a8ce866ffa5017fa0c1f47fd4f9f74a66a0bd6f88c9aaf7fc'
  };
  const psRemote = new PowerShellRemote(node.hostname, node.user, node.password, abaqusCommand.build());
  psRemote
    .on('stdout', (data, count) => {})
    .on('stderr', msg => {
      emitter.stderr += msg;
    })
    .on('error', error => {
      emitter.emit('error', job.toObject(), error);
    })
    .on('finish', (code, lastStdOut) => {
      // TODO ファイルを結果ディレクトリに移動する
      const resultDir = '';
      emitter.emit('finish', job.toObject(), code, lastStdOut, resultDir);
    })
    .invoke();

  emitter.emit('launch', job.toObject(), path.join(executionRootDir, workingDirName));
};
