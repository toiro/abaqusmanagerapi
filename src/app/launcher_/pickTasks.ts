import { JobStatus } from 'sharedDefinitions/model/resources/enums.js'
import { jobsOn, getActiveNodes, getActiveUsers } from 'app/junction/queries.js'
import { useSettingReadOnly } from 'app/junction/Setting.js'
import { AbsSerialPrepareThenPararelExecuteTask } from './task/AbsSerialPrepareThenPararelExecuteTask.js'
import createTask from './task/createTask.js'

export default async (): Promise<AbsSerialPrepareThenPararelExecuteTask[]> => {
  const [waitingJobs, runningJobs, startingJobs, readyJobs] = await Promise.all([
    jobsOn(JobStatus.Waiting),
    jobsOn(JobStatus.Running),
    jobsOn(JobStatus.Starting),
    jobsOn(JobStatus.Ready),
  ])

  if (waitingJobs.length === 0) return []
  // Waiting のジョブを priority - createdAt 順に並べる
  waitingJobs.sort((a, b) =>
    a.priority !== b.priority ? b.priority - a.priority : a.createdAt.getTime() - b.createdAt.getTime()
  )

  const countingJobs = runningJobs.concat(startingJobs).concat(readyJobs)

  const [users, nodes, availableToken] = await Promise.all([
    getActiveUsers(),
    getActiveNodes(),
    (async () => (await useSettingReadOnly()).availableTokenCount)(),
  ])

  const waitingTasks = waitingJobs.map((job) => createTask(job, users[job.owner], nodes[job.node]))
  const ret: AbsSerialPrepareThenPararelExecuteTask[] = []

  // process one by one
  // eslint-disable-next-line no-restricted-syntax
  for (const task of waitingTasks) {
    const [judge] = task.checkReqisite(countingJobs, availableToken)
    if (judge) {
      countingJobs.push(task.job)
      ret.push(task)
    }
  }

  return ret
}
