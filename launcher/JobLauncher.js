import { EventEmitter } from 'events';
import fs from 'fs';
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

async function launchJob(job, emitter) {
  // ファイルを配置する
  const executeRootDir = '';
  const dirName = `${job.owner}_${job.name}`;

  const executeDir = mkdirForceByWithNumber(`${executeRootDir}${dirName}\\`);
  if (job.input.uploaded) {
    // アップロードされたファイルを取得
    fs.promises.writeFile(`${executeDir}${job.input.uploaded.fileName}`, job.input.uploaded.content);
  } else if (job.input.sharedDirectoryPath) {
    // 共有ディレクトリから取得
    throw new Error('Not implemented yet');// TODO
  } else {
    throw new Error('No input file configuration');
  }

  // シェル起動は await しない
  const abaqusCommand = new AbaqusCommandBuilder();
  abaqusCommand
    .setJobName()
    .setInputFilePath()
    .setCpus();
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

  emitter.emit('launch', job.toObject(), executeDir);
};

async function mkdirForceByWithNumber(dirPath) {
  let tryCount = 0;
  while (true) {
    try {
      if (tryCount) {
        dirPath = `${dirPath}_${tryCount}`;
      }
      await fs.promises.mkdir();
      return dirPath;
    } catch (error) {
      if (error.code === 'EEXIST') {
        // 連番を振ってリトライ
        tryCount++;
      } else {
        throw error;
      }
    }
  }
}
