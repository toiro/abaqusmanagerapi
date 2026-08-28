import childProcess from 'child_process'
import EventEmitter from 'events'
import path from 'path'
import iconv from 'iconv-lite'

// const scriptDirectory = 'D:\\Nodes\\AbaqusManager\\AbaqusManagerApi\\utils\\powershell-remote';
// const scriptDirectory = 'C:\\Users\\toiro\\Documents\\Project\\AbaqusManager\\abaqusmanagerapi\\utils\\powershell-remote';
const sessionScript = path.join(process.cwd(), '.\\resources\\ps-scripts\\winrm-session.ps1')

const SHELL_ENCODE = 'sjis'

type PowerShellRemoteParameter = {
  host: string
  user: string
  encriptedPassword: string
  script: string
  timeoutMs?: number
}

type PowerShellRemoteResult = {
  returnCode: number
  stdout: string
  stderr: string
  lastOutput: string
}

export default class PowerShellRemote extends EventEmitter {
  param: PowerShellRemoteParameter

  count: number

  lastOutput: string

  constructor(host: string, user: string, encriptedPassword: string, script: string, timeoutMs?: number) {
    super()
    this.param = {
      host,
      user,
      encriptedPassword,
      script,
      ...(typeof timeoutMs === 'number' ? { timeoutMs } : {}),
    }
    this.count = 0
    this.lastOutput = ''
  }

  invoke() {
    // const script = path.join(path.relative(process.cwd(), scriptDirectory), sessionScript);
    const { param } = this

    // delete env.PSModeulePath to avoid this issue (https://github.com/PowerShell/PowerShell/issues/18530)
    delete process.env.PSModulePath
    const powerShell = childProcess.spawn('powershell', [
      sessionScript,
      param.host,
      param.user,
      param.encriptedPassword,
      param.script,
    ])

    let timedOut = false
    let timeoutId: NodeJS.Timeout | null = null
    const { timeoutMs } = param
    if (typeof timeoutMs === 'number' && timeoutMs > 0) {
      timeoutId = setTimeout(() => {
        timedOut = true
        this.emit(
          'stderr',
          `PowerShell process timed out after ${timeoutMs}ms on host ${param.host}. Try to terminate process tree.`
        )

        if (powerShell.pid) {
          childProcess.spawn('taskkill', ['/PID', `${powerShell.pid}`, '/T', '/F'])
        } else {
          powerShell.kill()
        }
      }, timeoutMs)
    }
    this.emit('start', [sessionScript, param.host, param.user, param.encriptedPassword, param.script])
    powerShell.stdout.on('data', (data: Buffer) => {
      this.lastOutput = data.toString()
      this.emit('stdout', iconv.decode(data, SHELL_ENCODE), this.count)
      this.count += 1
    })
    powerShell.stderr.on('data', (data: Buffer) => {
      this.emit('stderr', iconv.decode(data, SHELL_ENCODE))
    })
    powerShell.on('error', (error) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      this.emit('error', error)
    })
    powerShell.on('close', (code) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      if (timedOut && code === 0) {
        this.emit('finish', 1, this.lastOutput)
      } else {
        this.emit('finish', code, this.lastOutput)
      }
    })
  }

  invokeAsync() {
    return new Promise<PowerShellRemoteResult>((resolve, reject) => {
      let stdout = ''
      let stderr = ''
      this.on('stdout', (line) => {
        stdout += line
      })
        .on('stderr', (line) => {
          stderr += line
        })
        .on('error', (error) => reject(error))
        .on('finish', (code: number | null, lastOutput: string) => {
          if (code === null) {
            reject(new Error('PowerShell process closed with null exit code.'))
            return
          }
          resolve({ stdout, stderr, returnCode: code, lastOutput })
        })
        .invoke()
    })
  }
}

export function getStdoutParsed<T>(
  hostname: string,
  user: string,
  encPass: string,
  command: string,
  parser: (s: string) => T | PromiseLike<T>,
  options?: { timeoutMs?: number }
) {
  return new Promise<T>((resolve, reject) => {
    const psRemote = new PowerShellRemote(hostname, user, encPass, command, options?.timeoutMs)

    let content = ''
    let errorout = ''

    psRemote
      .on('start', (_param) => {})
      .on('stdout', (line, _count) => {
        content += line
      })
      .on('stderr', (line) => {
        errorout += line
      })
      .on('finish', (code) => {
        if (code === 0) {
          try {
            resolve(parser(content))
          } catch (err) {
            reject(err)
          }
        } else {
          if (errorout === '') {
            errorout = 'NO ERROR OUTPUT.'
          }
          if (content === '') {
            content = 'NO STANDARD OUTPUT.'
          }
          reject(
            new Error(
              `Error occuered in Exec Powershell from Remote on ${hostname}.\n${errorout}\n${content}\n${command}`
            )
          )
        }
      })
      .invoke()
  })
}

export function getStdout(hostname: string, user: string, encPass: string, command: string) {
  return getStdoutParsed<string>(hostname, user, encPass, command, (s: string) => s)
}

export function getJSON<T>(hostname: string, user: string, encPass: string, command: string) {
  return getStdoutParsed<T>(hostname, user, encPass, command, (content) => JSON.parse(content) as unknown as T)
}
