import path from 'path'
import PowerShellRemote from 'app/junction/powershell-remote/PowerShellRemote'
import { IJob } from 'sharedDefinitions/model/job'
import { INode } from 'sharedDefinitions/model/node.js'
import { IUser } from 'sharedDefinitions/model/user'
import { moveDirectory } from 'app/junction/powershell-remote/commands'

export interface ITask<> {}

export abstract class AbsSerialPrepareThenPararelExecuteTask {
  readonly job: IJob

  readonly owner: IUser

  readonly node: INode

  constructor(job: IJob, owner: IUser, node: INode) {
    this.job = job
    this.owner = owner
    this.node = node
  }

  abstract checkReqisite(countingJobs: IJob[], availableTokenCount: number): [boolean, message: string]
  abstract prepare(): Promise<ExecuteContext>
  async execute(cxt: ExecuteContext): Promise<ExecuteResult> {
    const { job } = this

    // console.log(abaqusCommand.build());
    const psRemote = new PowerShellRemote(
      this.node.hostname,
      this.node.winrmCredential.user,
      this.node.winrmCredential.encryptedPassword,
      cxt.command
    )

    const resultUserRoot = path.join(this.node.resultDirectoryRoot, job.owner)
    const resultDir = path.join(resultUserRoot, cxt.workingDirName)
    try {
      const ret = await psRemote.invokeAsync()
      return {
        code: ret.returnCode,
        resultDir,
        msg: ret.returnCode !== 0 && ret.stderr ? ret.stderr : psRemote.lastOutput,
      }
    } finally {
      try {
        await moveDirectory(this.node, cxt.executionDirPath, resultUserRoot)
      } catch (err) {
        // 実行ディレクトリが存在しない可能性があるが、特に問題にしない
      }
    }
  }
}

export type ExecuteContext = {
  command: string
  workingDirName: string
  executionDirPath: string
}

export type ExecuteResult = {
  code: number
  msg: string
  resultDir: string
}
