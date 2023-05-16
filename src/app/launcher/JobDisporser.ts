import { JobStatus } from 'sharedDefinitions/model/resources/enums.js'
import { jobsOn, getActiveNodes, deleteJob } from 'app/junction/queries.js'
import { testPath } from 'app/junction/powershell-remote/commands/index.js'
import { EventEmitter } from 'events'
import jobStatusReciever from 'app/junction/JobStatusRecieverSingleton.js'

const RetentionPeriod = 1000 * 60 * 60 * 24 * 3

export const DisposeEventName = {
  MARK: 'mark',
  DELETE: 'delete',
} as const
export type LaunchEventName = (typeof DisposeEventName)[keyof typeof DisposeEventName]

export default class JobDisposer extends EventEmitter {
  async dispose() {
    const JobsToDispose = (await jobsOn(JobStatus.Disposed)).filter(
      (j) => Date.now() > j.status.at.getTime() + RetentionPeriod
    )
    await Promise.all(
      JobsToDispose.map(async (job) => {
        await deleteJob(job)
        this.emit(DisposeEventName.DELETE, job)
      })
    )
  }

  async mark() {
    const completedJobs = await jobsOn(JobStatus.Completed)
    const nodes = await getActiveNodes()
    ;(
      await Promise.all(
        Object.values(nodes).map(async (node) => {
          const targets = completedJobs.filter((j) => j.node === node.hostname && j.status.resultDirectoryPath)
          const resultExists = await testPath(
            node,
            targets.map((t) => t.status.resultDirectoryPath as string)
          )

          return targets.filter((_t, index) => !resultExists[index])
        })
      )
    )
      .flat()
      .forEach((job) => {
        jobStatusReciever.dispose(job, 'Marked to dispose because result directory has been deleted.')
        this.emit(DisposeEventName.MARK, job)
      })
  }
}
