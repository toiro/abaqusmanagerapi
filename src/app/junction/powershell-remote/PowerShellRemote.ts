import childProcess from 'child_process';
import EventEmitter from 'events';
import path from 'path';
import iconv from 'iconv-lite';

// const scriptDirectory = 'D:\\Nodes\\AbaqusManager\\AbaqusManagerApi\\utils\\powershell-remote';
// const scriptDirectory = 'C:\\Users\\toiro\\Documents\\Project\\AbaqusManager\\abaqusmanagerapi\\utils\\powershell-remote';
const sessionScript = path.join(process.cwd(), '.\\resources\\ps-scripts\\winrm-session.ps1');

const SHELL_ENCODE = 'sjis';

type PowerShellRemoteParameter = {
  host: string;
  user: string;
  encriptedPassword: string;
  script: string;
};

type PowerShellRemoteResult = {
  returnCode: number;
  stdout: string;
  stderr: string;
};

export default class PowerShellRemote extends EventEmitter {
  param: PowerShellRemoteParameter;

  count: number;

  lastOutput: string;

  constructor(host: string, user: string, encriptedPassword: string, script: string) {
    super();
    this.param = {
      host,
      user,
      encriptedPassword,
      script,
    };
    this.count = 0;
    this.lastOutput = '';
  }

  invoke() {
    // const script = path.join(path.relative(process.cwd(), scriptDirectory), sessionScript);
    const { param } = this;
    // console.log([script, _param.host, _param.user, _param.encriptedPassword, _param.script]);
    const powerShell = childProcess.spawn('powershell', [
      sessionScript,
      param.host,
      param.user,
      param.encriptedPassword,
      param.script,
    ]);
    this.emit('start', [sessionScript, param.host, param.user, param.encriptedPassword, param.script]);
    powerShell.stdout.on('data', (data: Buffer) => {
      this.lastOutput = data.toString();
      this.emit('stdout', iconv.decode(data, SHELL_ENCODE), this.count);
      this.count += 1;
    });
    powerShell.stderr.on('data', (data: Buffer) => {
      this.emit('stderr', iconv.decode(data, SHELL_ENCODE));
    });
    powerShell.on('error', (error) => {
      this.emit('error', error);
    });
    powerShell.on('close', (code) => {
      this.emit('finish', code, this.lastOutput);
    });
  }

  invokePromise() {
    return new Promise<PowerShellRemoteResult>((resolve, reject) => {
      let stdout = '';
      let stderr = '';
      this.on('stdout', (line) => {
        stdout += line;
      })
        .on('stderr', (line) => {
          stderr += line;
        })
        .on('error', (error) => reject(error))
        .on('close', (code: number) => {
          resolve({ stdout, stderr, returnCode: code });
        })
        .invoke();
    });
  }
}

export function getStdoutParsed<T>(
  hostname: string,
  user: string,
  encPass: string,
  command: string,
  parser: (s: string) => T | PromiseLike<T>
) {
  return new Promise<T>((resolve, reject) => {
    const psRemote = new PowerShellRemote(hostname, user, encPass, command);

    let content = '';
    let errorout = '';

    psRemote
      .on('start', (_param) => {})
      .on('stdout', (line, _count) => {
        content += line;
      })
      .on('stderr', (line) => {
        errorout += line;
      })
      .on('finish', (code) => {
        if (code === 0) {
          try {
            resolve(parser(content));
          } catch (err) {
            reject(err);
          }
        } else {
          if (errorout === '') {
            errorout = 'NO ERROR OUTPUT.';
          }
          if (content === '') {
            content = 'NO STANDARD OUTPUT.';
          }
          reject(
            new Error(
              `Error occuered in Exec Powershell from Remote on ${hostname}.\n${errorout}\n${content}\n${command}`
            )
          );
        }
      })
      .invoke();
  });
}

export function getStdout(hostname: string, user: string, encPass: string, command: string) {
  return getStdoutParsed<string>(hostname, user, encPass, command, (s: string) => s);
}

export function getJSON<T>(hostname: string, user: string, encPass: string, command: string) {
  return getStdoutParsed<T>(hostname, user, encPass, command, (content) => JSON.parse(content) as unknown as T);
}
