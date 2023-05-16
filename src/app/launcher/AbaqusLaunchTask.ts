import fs from 'fs'
import path from 'path'
import { IJob } from 'sharedDefinitions/model/job.js'
import dateformat from 'dateformat'
import AbaqusCommandBuilder from 'app/junction/abaqus/AbaqusCommandBuilder.js'
import PowerShellRemote from 'app/junction/powershell-remote/PowerShellRemote.js'
import {
  sendFile,
  setupInputFromSharedDirectory,
  moveDirectory,
} from 'app/junction/powershell-remote/commands/index.js'
import { getNode } from 'app/junction/queries.js'
import { INode } from 'sharedDefinitions/model/node.js'
import { ISerialThenPararelTask } from './SerialThenPararelTaskLauncher.js'

const datePostfixFormat = 'yyyymmddHHMMssl'

export type AbaqusLunchJobContext = {
  node: INode
  inputFileName: string
  workingDirName: string
  executionDirPath: string
}

export type AbaqusLunchJobResult = {
  code: number
  msg: string
  resultDir: string
}

export default class AbaqusLaunchTask implements ISerialThenPararelTask<AbaqusLunchJobContext, AbaqusLunchJobResult> {
  readonly job: IJob

  constructor(job: IJob) {
    this.job = job
  }

  async serial() {
    // ファイル移動は並列に行わない
    const { job } = this

    const datePostfix = dateformat(Date.now(), datePostfixFormat)
    const workingDirName = `${job.owner}_${job.name}_${datePostfix}`
    const node = await getNode(job.node)

    // ファイルを配置する
    if (job.input.type === 'upload') {
      const gridfs = (await import('app/store/gridfs-promise.js')).default
      const localTempDir = path.join(process.cwd(), 'temp', workingDirName)
      const meta = await gridfs.findById(job.input.uploaded)
      const inputFileName = meta.filename

      // アップロードされたファイルをローカルtempに配置
      await fs.promises.mkdir(localTempDir, { recursive: true })
      try {
        const readStream = await gridfs.openDownloadStream(job.input.uploaded)
        const writeStream = fs.createWriteStream(path.join(localTempDir, inputFileName))
        readStream.pipe(writeStream)

        // ノードにファイルを配置
        await sendFile(node, localTempDir, node.executeDirectoryRoot)
      } finally {
        // 一時ファイルを削除する。非同期にして以後関知しない。
        fs.rm(localTempDir, { recursive: true }, () => {})
      }
      return {
        node,
        inputFileName,
        workingDirName,
        executionDirPath: path.join(node.executeDirectoryRoot, workingDirName),
      }
    }
    if (job.input.type === 'sharedDirectory') {
      // 作業ディレクトリに必要なファイルを配置し、インプットファイルが最後の一つならソースディレクトリを削除する
      const inputFileName = job.input.inputfile
      await setupInputFromSharedDirectory(
        node,
        job.input.path,
        node.executeDirectoryRoot,
        inputFileName,
        workingDirName
      )
      return {
        node,
        inputFileName,
        workingDirName,
        executionDirPath: path.join(node.executeDirectoryRoot, workingDirName),
      }
    }
    throw new Error('No input file configuration.')
  }

  async parallel(cxt: AbaqusLunchJobContext) {
    const { job } = this
    const command = 'abaqus'
    const abaqusCommand = new AbaqusCommandBuilder(
      command,
      {
        jobName: job.name,
        fileName: cxt.inputFileName,
        cpus: job.command.cpus,
        executeDirRoot: cxt.node.executeDirectoryRoot,
        workingDirName: cxt.workingDirName,
      },
      job.command.options
    )

    // console.log(abaqusCommand.build());
    const psRemote = new PowerShellRemote(
      cxt.node.hostname,
      cxt.node.winrmCredential.user,
      cxt.node.winrmCredential.encryptedPassword,
      abaqusCommand.build()
    )
    try {
      const ret = await psRemote.invokeAsync()
      return {
        code: ret.returnCode,
        resultDir: path.join(cxt.node.resultDirectoryRoot, job.owner, cxt.workingDirName),
        msg: ret.returnCode !== 0 && ret.stderr ? ret.stderr : psRemote.lastOutput,
      }
    } finally {
      try {
        await moveDirectory(
          cxt.node,
          path.join(cxt.node.executeDirectoryRoot, cxt.workingDirName),
          path.join(cxt.node.resultDirectoryRoot, job.owner)
        )
      } catch (err) {
        // 実行ディレクトリが存在しない可能性があるが、特に問題にしない
      }
    }
  }
}
