import childProcess from 'child_process';
import EventEmitter from 'events';
import path from 'path';
import iconv from 'iconv-lite';
import scriptDir from '~/utils/scriptdir.js';

const scriptDirectory = scriptDir(import.meta);
// const scriptDirectory = 'D:\\Nodes\\AbaqusManager\\AbaqusManagerApi\\utils\\powershell-remote';
// const scriptDirectory = 'C:\\Users\\toiro\\Documents\\Project\\AbaqusManager\\abaqusmanagerapi\\utils\\powershell-remote';
const sessionScript = '.\\ps-scripts\\winrm-session.ps1';

const SHELL_ENCODE = 'sjis';

export default class PowerShellRemote extends EventEmitter {
  constructor(host, user, encriptedPassword, script) {
    super();
    this._param = {
      host,
      user,
      encriptedPassword,
      script
    };
    this._count = 0;
    this._lastOutput = '';
  };

  invoke() {
    const script = path.join(path.relative(process.cwd(), scriptDirectory), sessionScript);
    const _param = this._param;
    // console.log([script, _param.host, _param.user, _param.encriptedPassword, _param.script]);
    const powerShell = childProcess.spawn('powershell', [script, _param.host, _param.user, _param.encriptedPassword, _param.script]);
    this.emit('start', [sessionScript, _param.host, _param.user, _param.encriptedPassword, _param.script]);
    powerShell.stdout.on('data', data => {
      this._lastOutput = data.toString();
      this.emit('stdout', iconv.decode(data, SHELL_ENCODE), this._count);
      this._count++;
    });
    powerShell.stderr.on('data', data => {
      this.emit('stderr', iconv.decode(data, SHELL_ENCODE));
    });
    powerShell.on('error', error => {
      this.emit('error', error);
    });
    powerShell.on('close', code => {
      this.emit('finish', code, this._lastOutput);
    });
  };

  invokePromise() {
    return new Promise((resolve, reject) => {
      const ret = {
        returnCode: '',
        stdout: '',
        stderr: ''
      };
      this
        .on('stdout', line => { ret.stdout += line; })
        .on('stderr', line => { ret.stderr += line; })
        .on('error', error => reject(error))
        .on('close', code => {
          ret.returnCode = code;
          resolve(ret);
        })
        .invoke();
    });
  }
}

export function getStdout(hostname, user, encPass, command, parser) {
  return new Promise(
    (resolve, reject) => {
      const psRemote = new PowerShellRemote(hostname, user, encPass, command);

      let content = '';
      let errorout = '';

      psRemote
        .on('start', param => {})
        .on('stdout', (line, count) => { content += line; })
        .on('stderr', line => { errorout += line; })
        .on('finish', code => {
          if (code === 0) {
            try {
              resolve(parser ? parser(content) : content);
            } catch (err) {
              reject(err);
            }
          } else { reject(new Error(`Error occuered in Exec Powershell from Remote on ${hostname}.\n${errorout}\n${command}`)); }
        })
        .invoke();
    }
  );
}

export function getJSON(hostname, user, encPass, command) {
  return getStdout(hostname, user, encPass, command, JSON.parse);
}
