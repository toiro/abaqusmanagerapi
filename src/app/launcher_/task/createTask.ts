import { IJob } from 'sharedDefinitions/model/job'
import { IUser } from 'sharedDefinitions/model/user.js'
import { INode } from 'sharedDefinitions/model/node.js'
import { AbsSerialPrepareThenPararelExecuteTask } from './AbsSerialPrepareThenPararelExecuteTask.js'
import AbaqusTask from './AbaqusTask.js'

export default (
  job: IJob,
  user: IUser | undefined,
  node: INode | undefined
): AbsSerialPrepareThenPararelExecuteTask => {
  if (user === undefined) throw new Error('user missing.')
  if (node === undefined) throw new Error('node missing.')

  return new AbaqusTask(job, user, node)
}
