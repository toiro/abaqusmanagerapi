import fs from 'fs'
import path from 'path'
import dateformat from 'dateformat'
import AbaqusCommandBuilder from 'app/junction/abaqus/AbaqusCommandBuilder.js'
import { sendFile, setupInputFromSharedDirectory } from 'app/junction/powershell-remote/commands/index.js'
import { getNode } from 'app/junction/queries.js'
import { IJob } from 'sharedDefinitions/model/job.js'
import * as licence from 'app/junction/abaqus/abaqus-license.js'
import { AbsSerialPrepareThenPararelExecuteTask, ExecuteContext } from './AbsSerialPrepareThenPararelExecuteTask.js'

const datePostfixFormat = 'yyyymmddHHMMssl'

export default class AbaqusTask extends AbsSerialPrepareThenPararelExecuteTask {
  checkReqisite(countingJobs: IJob[], availableTokenCount: number): [boolean, message: string] {
    // is the node active?
    if (!this.node || !this.node.isActive) return [false, 'the node is inactive']

    function countJob(jobs: IJob[]) {
      return jobs.reduce((sum, j) => sum + (j.input.type === 'external' ? j.input.maxConcurrentJobs : 1), 0)
    }
    function countCPUs(jobs: IJob[]) {
      return jobs.reduce(
        (sum, j) => sum + (j.input.type === 'external' ? j.input.cpus * j.input.maxConcurrentJobs : j.command.cpus),
        0
      )
    }

    // ユーザー同時実行数
    const maxConcurrentJobForUser = this.owner ? this.owner.maxConcurrentJob : 0
    const ownerCount = countJob(countingJobs.filter((_) => _.owner === this.job.owner).concat([this.job]))
    if (ownerCount > maxConcurrentJobForUser) return [false, 'exceed the user job count limit.']

    const jobsOnNode = countingJobs.filter((_) => _.node === this.job.node).concat([this.job])

    // server cpu
    const runningCPUCountForNode = countCPUs(jobsOnNode)
    if (runningCPUCountForNode > this.node.availableCPUs) return [false, 'exceed the node cpu limit.']

    // server token
    const runningTokenCountForNode = licence.calcLicenseForJobs(jobsOnNode)
    if (runningTokenCountForNode > this.node.licenseTokenQuota) return [false, 'exceed the node token quota.']

    // ライセンス
    const tokenToClaim = licence.calcLicenseForJob(this.job)
    const tokenInUse = licence.calcLicenseForJobs(countingJobs)
    if (availableTokenCount < tokenToClaim + tokenInUse) return [false, 'exceed the total token limit.']

    return [true, '']
  }

  override async prepare(): Promise<ExecuteContext> {
    // ファイル移動は並列に行わない
    const { job } = this

    const datePostfix = dateformat(Date.now(), datePostfixFormat)
    const workingDirName = `${job.owner}_${job.name}_${datePostfix}`
    const node = await getNode(job.node)
    const executionDirPath = path.join(node.executeDirectoryRoot, workingDirName)

    const abaqusCommand = new AbaqusCommandBuilder(
      'abaqus',
      {
        jobName: job.name,
        fileName: '', // not determined yet here
        cpus: job.command.cpus,
        executeDirRoot: node.executeDirectoryRoot,
        workingDirName,
      },
      job.command.options
    )

    // ファイルを配置する
    if (job.input.type === 'upload') {
      const gridfs = (await import('app/store/gridfs-promise.js')).default
      const localTempDir = path.join(process.cwd(), 'temp', workingDirName)
      const meta = await gridfs.findById(job.input.uploaded)
      const inputFileName = meta.filename

      abaqusCommand.param.fileName = inputFileName

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
        command: abaqusCommand.build(),
        workingDirName,
        executionDirPath,
      }
    }

    if (job.input.type === 'sharedDirectory') {
      // 作業ディレクトリに必要なファイルを配置し、インプットファイルが最後の一つならソースディレクトリを削除する
      const inputFileName = job.input.inputfile
      abaqusCommand.param.fileName = inputFileName

      await setupInputFromSharedDirectory(
        node,
        job.input.path,
        node.executeDirectoryRoot,
        inputFileName,
        workingDirName
      )
      return {
        command: abaqusCommand.build(),
        workingDirName,
        executionDirPath,
      }
    }
    throw new Error('No input file configuration.')
  }
}
