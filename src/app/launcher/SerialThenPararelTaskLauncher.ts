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
    this.queue.push(task, (error, context: Context | undefined) => {
      if (error) {
        // serial() failure is handled by queue.error(handler)
        return
      }
      this.emit(LaunchEventName.LAUNCH, task, context)
      task
        .parallel(context)
        .then((ret) => {
          this.emit(LaunchEventName.FINISH, task, ret)
        })
        .catch((parallelError) => {
          this.emit(LaunchEventName.ERROR, task, parallelError)
        })
    })
    const count = this.queue.length()
    if (count > 1) {
      this.emit(LaunchEventName.QUEUE, task, count)
    }
  }
}
