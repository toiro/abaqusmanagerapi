import { EventEmitter } from 'events';
import async from 'async';
import fs from 'fs';
import path from 'path';
import dateformat from 'dateformat';
import NodeModel from '~/models/node.js';
import PowerShellRemote from '~/utils/powershell-remote/PowerShellRemote.js';
import AbaqusCommandBuilder from '~/utils/powershell-remote/AbaqusCommandBuilder.js';
import sendFile from '~/utils/powershell-remote/commands/sendFile.js';
import moveDirectory from '~/utils/powershell-remote/commands/moveDirectory.js';
import setupInputFromSharedDirectory from '~/utils/powershell-remote/commands/setupInputFromSharedDirectory.js';

const events = Object.freeze({
  START: 'start',
  LAUNCH: 'launch',
  FINISH: 'finish',
  QUEUE: 'queue',
  ERROR: 'error'
});

export default class JobLauncher extends EventEmitter {
  constructor() {
    super();
    // 起動準備で Powershell を通じたファイルアクセスが発生するので、並行処理を避けるために queue を使う
    this.queue = async.queue(async params => launchJob(params.job, params.emitter));
    this.queue.error((err, params) => {
      this.emit(events.QUEUE, params.job.toObject(), err);
    });
  }

  launch(job) {
    this.queue.push({ job, emitter: this });
    const count = this.queue.length();
    if (count > 1) {
      this.emit(events.WAIT, job.toObject(), count);
    }
  }
}

const datePostfixFormat = 'yyyymmddHHMMssl';
async function launchJob(job, emitter) {
  emitter.emit(events.START, job.toObject);

  const datePostfix = dateformat(Date.now(), datePostfixFormat);
  const workingDirName = `${job.owner}_${job.name}_${datePostfix}`;
  const node = (await NodeModel.findOne({ hostname: job.node }).exec()).toObject();

  // ファイルを配置する
  let inputFileName = '';
  if (job.input.uploaded) {
    const gridfs = (await import('~/utils/gridfs-promise.js')).default;
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
    inputFileName = $param.inputfile;
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

  // abaqus コマンド起動
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
  // await しない
  psRemote
    .on('stdout', (data, count) => {
    })
    .on('stderr', msg => {
      if (!emitter.stderr) emitter.stderr = '';
      emitter.stderr += msg;
    })
    .on('error', error => {
      emitter.emit(events.ERROR, job.toObject(), error);
    })
    .on('finish', async(code, lastStdOut) => {
      const resultDir = path.join(node.resultDirectoryRoot, job.owner, workingDirName);
      try {
        await moveDirectory(node, path.join(node.executeDirectoryRoot, workingDirName), path.join(node.resultDirectoryRoot, job.owner));
      } catch (err) {
        // 実行ディレクトリが存在しない可能性があるが、特に問題にしない
      }

      const msg = (code !== 0 && emitter.stderr) ? emitter.stderr : lastStdOut;
      emitter.emit(events.FINISH, job.toObject(), code, msg, resultDir);
    })
    .invoke();

  emitter.emit(events.LAUNCH, job.toObject(), path.join(node.executeDirectoryRoot, workingDirName));
};
