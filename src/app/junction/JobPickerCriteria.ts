import * as licence from 'app/junction/abaqus/abaqus-license.js'
import type { IUser } from 'sharedDefinitions/model/user.js'
import type { INode } from 'sharedDefinitions/model/node.js'
import type { IJob } from 'sharedDefinitions/model/job.js'
import { getActiveNodes, getActiveUsers } from './queries.js'
import { useSettingReadOnly } from './Setting.js'

export default class JobPickCriteria {
  users: { [name: string]: IUser } = {}

  nodes: { [hostname: string]: INode } = {}

  availableToken: number = 0

  async init() {
    ;[this.users, this.nodes, this.availableToken] = await Promise.all([
      getActiveUsers(),
      getActiveNodes(),
      (async () => (await useSettingReadOnly()).availableTokenCount)(),
    ])
  }

  judge(waitingJobs: IJob[], runningJobs: IJob[]) {
    const startingJobs: IJob[] = []

    // process one by one
    // eslint-disable-next-line no-restricted-syntax
    for (const job of waitingJobs) {
      if (this.judgeJob(job, runningJobs.concat(startingJobs))) {
        startingJobs.push(job)
      }
    }

    return startingJobs
  }

  judgeJob(job: IJob, runningJobs: IJob[]) {
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
    const user = this.users[job.owner]
    const maxConcurrentJobForUser = user ? user.maxConcurrentJob : 0
    const ownerCount = countJob(runningJobs.filter((_) => _.owner === job.owner).concat([job]))
    if (ownerCount > maxConcurrentJobForUser) return false

    // server
    const node = this.nodes[job.node]
    if (!node) return false // server is inactive

    const jobsOnNode = runningJobs.filter((_) => _.node === job.node).concat([job])

    // server cpu
    const runningCPUCountForNode = countCPUs(jobsOnNode)
    if (runningCPUCountForNode > node.availableCPUs) return false

    // server token
    const runningTokenCountForNode = licence.calcLicenseForJobs(jobsOnNode)
    if (runningTokenCountForNode > node.licenseTokenQuota) return false

    // サーバー同時実行数
    // const maxConcurrentJobForNode = node ? node.maxConcurrentJob : 0;
    // const nodeCount = countJob(runningJobs.filter((_) => _.node === job.node).concat([job]));
    // if (nodeCount > maxConcurrentJobForNode) return false;

    // ライセンス
    const tokenToClaim = licence.calcLicenseForJob(job)
    const tokenInUse = licence.calcLicenseForJobs(runningJobs)
    if (this.availableToken < tokenToClaim + tokenInUse) return false

    return true
  }
}
