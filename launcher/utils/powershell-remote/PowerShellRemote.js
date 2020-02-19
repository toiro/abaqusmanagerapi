import childProcess from 'child_process';
import EventEmitter from 'events';

const sessionScript = './powershell-remote/ps-scripts/winrm-session.ps1';

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
    const _param = this._param;
    const powerShell = childProcess.spawn('powershell', [sessionScript, _param.host, _param.user, _param.encriptedPassword, _param.script]);
    powerShell.stdout.on('data', data => {
      this._lastOutput = data.toString();
      this.emit('stdout', data, this._count);
      // console.log(`${this._count}:${data.toString().split(/\r\n|\r|\n/)[0]}`);
      // console.log(`${this._count}:${data.toString()}`);
      this._count++;
    });
    powerShell.stderr.on('data', data => {
      this.emit('stderr', data);
    });
    powerShell.on('error', error => {
      this.emit('error', error);
    });
    powerShell.on('close', code => {
      this.emit('finish', code, this._lastOutput);
    });
  };
}
