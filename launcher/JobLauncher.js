import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import dateformat from 'dateformat';
import NodeModel from '~/models/node.js';
import PowerShellRemote from '~/utils/powershell-remote/PowerShellRemote.js';
import AbaqusCommandBuilder from '~/utils/powershell-remote/AbaqusCommandBuilder.js';
import sendFile from '~/utils/powershell-remote/commands/sendFile.js';
import moveDirectory from '~/utils/powershell-remote/commands/moveDirectory.js';
import setupInputFromSharedDirectory from '~/utils/powershell-remote/commands/setupInputFromSharedDirectory.js';

export default class JobLauncher extends EventEmitter {
  // constructor () {super();};
  async launch(job) {
    try {
      await launchJob(job, this);
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
  const node = (await NodeModel.findOne({ hostname: job.node }).exec()).toObject();

  // ファイルを配置する
  let inputFileName = '';
  if (job.input.uploaded) {
    const localTempDir = path.join(process.cwd(), 'temp', workingDirName);
    const meta = await gridfs.findById(job.input.uploaded);
    inputFileName = meta.filename;

    // アップロードされたファイルをローカルtempに配置
    await fs.promises.mkdir(localTempDir, { recursive: true });
    try {
      const readStream = await gridfs.openDownloadStream(job.input.uploaded);
      const writeStream = fs.createWriteStream(path.join(localTempDir, inputFileName));
      readStream.pipe(writeStream);

      // ノードにファイルを配置
      await sendFile(node, localTempDir, node.executeDirectoryRoot);
    } finally {
      // 一時ファイルを削除する。非同期にして以後関知しない。
      fs.rmdir(localTempDir, { recursive: true }, () => {});
    }
  } else if (job.input.sharedDirectory) {
    const $param = job.input.sharedDirectory;
    // 作業ディレクトリに必要なファイルを配置し、インプットファイルが最後の一つならソースディレクトリを削除する
    await setupInputFromSharedDirectory(node, $param.path, node.executeDirectoryRoot, $param.inputfile, workingDirName);
  } else {
    throw new Error('No input file configuration.');
  }

  let command = 'abaqus';
  // user subroutine 対応
  const useUserSubroutine = job.command.options.some(_ => _.name === 'user');
  if (useUserSubroutine) {
    const scriptFileName = 'subroutine.bat';
    const userSubroutineScript = path.join(process.cwd(), 'resources', scriptFileName);
    await sendFile(node, userSubroutineScript, path.join(node.executeDirectoryRoot, workingDirName));
    command = `.\\${scriptFileName}`;
  }

  // シェル起動は await しない
  console.log(job);
  const abaqusCommand = new AbaqusCommandBuilder(command);
  abaqusCommand
    .setJobName(job.name)
    .setFileName(inputFileName)
    .setCpus(job.command.cpus)
    .setOptions(job.command.options)
    .setExecuteDirRoot(node.executeDirectoryRoot)
    .setWorkingDirName(workingDirName);

  console.log(abaqusCommand.build());
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
    .on('finish', async(code, lastStdOut) => {
      const resultDir = path.join(node.resultDirectoryRoot, job.owner, workingDirName);
      try {
        await moveDirectory(node, path.join(node.executeDirectoryRoot, workingDirName), path.join(node.resultDirectoryRoot, job.owner));
      } catch (err) {
        // 実行ディレクトリが存在しない可能性があるが、特に問題にしない
      }

      const msg = (code !== 0 && emitter.stderr) ? emitter.stderr : lastStdOut;
      emitter.emit('finish', job.toObject(), code, msg, resultDir);
    })
    .invoke();

  emitter.emit('launch', job.toObject(), path.join(node.executeDirectoryRoot, workingDirName));
};
