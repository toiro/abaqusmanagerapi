import { EventEmitter } from 'events'
import async from 'async'
import {
  AbsSerialPrepareThenPararelExecuteTask,
  ExecuteContext,
} from './task/AbsSerialPrepareThenPararelExecuteTask.js'

export const LaunchEventName = {
  DEPLOY: 'deploy',
  LAUNCH: 'launch',
  FINISH: 'finish',
  QUEUE: 'queue',
  ERROR: 'error',
} as const
export type LaunchEventName = (typeof LaunchEventName)[keyof typeof LaunchEventName]

export default class SerialPrepareThenPararelExecuteTaskLauncher extends EventEmitter {
  queue: async.QueueObject<AbsSerialPrepareThenPararelExecuteTask>

  constructor() {
    super()
    this.queue = async.queue(async (task: AbsSerialPrepareThenPararelExecuteTask) => {
      this.emit(LaunchEventName.DEPLOY, task)
      return task.prepare()
    })
    this.queue.error((error, task) => {
      this.emit(LaunchEventName.ERROR, task, error)
    })
  }

  launch(task: AbsSerialPrepareThenPararelExecuteTask) {
    this.queue.push(task, async (error, context: ExecuteContext | undefined) => {
      if (error) {
        throw error
      }
      if (context === undefined) {
        throw new Error('Task context is missing.')
      }
      this.emit(LaunchEventName.LAUNCH, task, context)
      const ret = await task.execute(context)
      this.emit(LaunchEventName.FINISH, task, ret)
      return ret
    })
    const count = this.queue.length()
    if (count > 1) {
      this.emit(LaunchEventName.QUEUE, task, count)
    }
  }
}
