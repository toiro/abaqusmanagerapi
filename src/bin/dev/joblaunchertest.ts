import SerialThenPararelTaskLauncher, { ISerialThenPararelTask } from 'app/launcher/SerialThenPararelTaskLauncher.js'

class Task implements ISerialThenPararelTask {
  readonly name: string

  readonly sDuration: number

  readonly pDuration: number

  constructor(name: string, sDuration: number, pDuration: number) {
    this.name = name
    this.sDuration = sDuration
    this.pDuration = pDuration
  }

  async serial(): Promise<void> {
    return new Promise<void>((resolve) => {
      // console.log(`${this.name} start serial phase.`)
      setTimeout(() => {
        console.log(`${this.name} finish serial phase.`)
        resolve()
      }, this.sDuration)
    })
  }

  async parallel(): Promise<void> {
    return new Promise<void>((resolve) => {
      // console.log(`${this.name} start parallel phase.`)
      setTimeout(() => {
        // console.log(`${this.name} finish parallel phase.`)
        resolve()
      }, this.pDuration)
    })
  }
}

const list = ['a', 'b', 'c']

const tasks = list.map((n) => new Task(n, 1000, 10000))

const launcher = new SerialThenPararelTaskLauncher()
launcher.on('error', (_task, error) => console.error(error))
launcher.on('start', (task: Task) => console.error(`${task.name} starts.`))
launcher.on('launch', (task: Task) => console.error(`${task.name} has launched.`))
launcher.on('queue', (task: Task) => console.error(`${task.name} is queued.`))
launcher.on('finish', (task: Task) => console.error(`${task.name} has finished.`))

tasks.forEach((t) => launcher.launch(t))
