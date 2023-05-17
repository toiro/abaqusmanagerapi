import { EventEmitter } from 'events'
import async from 'async'

export const LaunchEventName = {
  DEPLOY: 'deploy',
  LAUNCH: 'launch',
  FINISH: 'finish',
  QUEUE: 'queue',
  ERROR: 'error',
} as const
export type LaunchEventName = (typeof LaunchEventName)[keyof typeof LaunchEventName]

export interface ISerialThenPararelTask<Context = void, Result = void> {
  serial(): Promise<Context>
  parallel(cxt: Context | undefined): Promise<Result>
}

export default class SerialThenPararelTaskLauncher<Context = void, Result = void> extends EventEmitter {
  queue: async.QueueObject<ISerialThenPararelTask<Context, Result>>

  constructor() {
    super()
    this.queue = async.queue(async (task: ISerialThenPararelTask<Context, Result>) => {
      this.emit(LaunchEventName.DEPLOY, task)
      return task.serial()
    })
    this.queue.error((error, task) => {
      this.emit(LaunchEventName.ERROR, task, error)
    })
  }

  launch(task: ISerialThenPararelTask<Context, Result>) {
    this.queue.push(task, async (error, context: Context | undefined) => {
      if (error) {
        throw error
      }
      this.emit(LaunchEventName.LAUNCH, task, context)
      const ret = await task.parallel(context)
      this.emit(LaunchEventName.FINISH, task, ret)
      return ret
    })
    const count = this.queue.length()
    if (count > 1) {
      this.emit(LaunchEventName.QUEUE, task, count)
    }
  }
}
