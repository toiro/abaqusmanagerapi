import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import dateformat from 'dateformat';
import PowerShellRemote from '~/utils/powershell-remote/PowerShellRemote.js';
import AbaqusCommandBuilder from '~/utils/powershell-remote/AbaqusCommandBuilder.js';
import NodeModel from '~/models/node.js';
import sendFile from '~/utils/powershell-remote/sendFile.js';
import moveDirectory from '~/utils/powershell-remote/moveDirectory.js';

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
  const gridfs = (await import('~/utils/gridfs-promise.js')).default;

  const datePostfix = dateformat(Date.now(), datePostfixFormat);
  const workingDirName = `${job.owner}_${job.name}_${datePostfix}`;
  const localTempDir = path.join(process.cwd(), 'temp');
  // ファイルを配置する
  const node = (await NodeModel.findOne({ hostname: job.node }).exec()).toObject();

  let inputFileName = '';
  if (job.input.uploaded) {
    const meta = await gridfs.findById(job.input.uploaded);
    inputFileName = meta.filename;

    // アップロードされたファイルをローカルtempに配置
    await fs.promises.mkdir(path.join(localTempDir, workingDirName));
    const readStream = await gridfs.openDownloadStream(job.input.uploaded);
    const writeStream = fs.createWriteStream(path.join(localTempDir, workingDirName, inputFileName));
    readStream.pipe(writeStream);

    // ノードにファイルを配置
    await sendFile(node, path.join(localTempDir, workingDirName), node.executeDirectoryRoot);
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
    .setExecuteDirRoot(node.executeDirectoryRoot)
    .setWorkingDirName(workingDirName);

  const psRemote = new PowerShellRemote(node.hostname, node.winrmCredential.user, node.winrmCredential.encryptedPassword, abaqusCommand.build());
  psRemote
    .on('stdout', (data, count) => {
    })
    .on('stderr', msg => {
      if (!emitter.stderr) emitter.stderr = '';
      emitter.stderr += msg;
    })
    .on('error', error => {
      emitter.emit('error', job.toObject(), error);
    })
    .on('finish', (code, lastStdOut) => {
      const resultDir = path.join(node.resultDirectoryRoot, job.owner, workingDirName);
      moveDirectory(node, path.join(node.executeDirectoryRoot, workingDirName), path.join(node.resultDirectoryRoot, job.owner));

      const msg = (code !== 0 && emitter.stderr) ? emitter.stderr : lastStdOut;
      emitter.emit('finish', job.toObject(), code, msg, resultDir);
    })
    .invoke();

  emitter.emit('launch', job.toObject(), path.join(node.executeDirectoryRoot, workingDirName));
};
