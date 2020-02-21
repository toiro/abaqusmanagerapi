import childProcess from 'child_process';
import EventEmitter from 'events';
import path from 'path';
import iconv from 'iconv-lite';
import scriptDir from '~/utils/scriptdir.js';

// const scriptDir = scriptDir(import.meta);
const scriptDirectory = 'C:\\Users\\toiro\\Documents\\Project\\AbaqusManager\\abaqusmanagerapi\\launcher\\utils\\powershell-remote';
const sessionScript = '.\\ps-scripts\\winrm-session.ps1';

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
      this.emit('stdout', iconv.decode(data, 'Shift-JIS'), this._count);
      this._count++;
    });
    powerShell.stderr.on('data', data => {
      this.emit('stderr', iconv.decode(data, 'Shift-JIS'));
    });
    powerShell.on('error', error => {
      this.emit('error', error);
    });
    powerShell.on('close', code => {
      this.emit('finish', code, this._lastOutput);
    });
  };
}
