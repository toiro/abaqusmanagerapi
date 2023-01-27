import childProcess from 'child_process';
import EventEmitter from 'events';
import path from 'path';
import iconv from 'iconv-lite';
// const scriptDirectory = 'D:\\Nodes\\AbaqusManager\\AbaqusManagerApi\\utils\\powershell-remote';
// const scriptDirectory = 'C:\\Users\\toiro\\Documents\\Project\\AbaqusManager\\abaqusmanagerapi\\utils\\powershell-remote';
const sessionScript = path.join(process.cwd(), '.\\resources\\ps-scripts\\winrm-session.ps1');
const SHELL_ENCODE = 'sjis';
export default class PowerShellRemote extends EventEmitter {
    constructor(host, user, encriptedPassword, script) {
        super();
        this._param = {
            host,
            user,
            encriptedPassword,
            script,
        };
        this._count = 0;
        this._lastOutput = '';
    }
    invoke() {
        // const script = path.join(path.relative(process.cwd(), scriptDirectory), sessionScript);
        const { _param } = this;
        // console.log([script, _param.host, _param.user, _param.encriptedPassword, _param.script]);
        const powerShell = childProcess.spawn('powershell', [
            sessionScript,
            _param.host,
            _param.user,
            _param.encriptedPassword,
            _param.script,
        ]);
        this.emit('start', [sessionScript, _param.host, _param.user, _param.encriptedPassword, _param.script]);
        powerShell.stdout.on('data', (data) => {
            this._lastOutput = data.toString();
            this.emit('stdout', iconv.decode(data, SHELL_ENCODE), this._count);
            this._count++;
        });
        powerShell.stderr.on('data', (data) => {
            this.emit('stderr', iconv.decode(data, SHELL_ENCODE));
        });
        powerShell.on('error', (error) => {
            this.emit('error', error);
        });
        powerShell.on('close', (code) => {
            this.emit('finish', code, this._lastOutput);
        });
    }
    invokePromise() {
        return new Promise((resolve, reject) => {
            let stdout = '';
            let stderr = '';
            this.on('stdout', (line) => {
                stdout += line;
            })
                .on('stderr', (line) => {
                stderr += line;
            })
                .on('error', (error) => reject(error))
                .on('close', (code) => {
                resolve({ stdout, stderr, returnCode: code.parseInt() });
            })
                .invoke();
        });
    }
}
export function getStdoutParsed(hostname, user, encPass, command, parser) {
    return new Promise((resolve, reject) => {
        const psRemote = new PowerShellRemote(hostname, user, encPass, command);
        let content = '';
        let errorout = '';
        psRemote
            .on('start', (_param) => { })
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
                }
                catch (err) {
                    reject(err);
                }
            }
            else {
                if (errorout === '') {
                    errorout = 'NO ERROR OUTPUT.';
                }
                if (content === '') {
                    content = 'NO STANDARD OUTPUT.';
                }
                reject(new Error(`Error occuered in Exec Powershell from Remote on ${hostname}.\n${errorout}\n${content}\n${command}`));
            }
        })
            .invoke();
    });
}
export function getStdout(hostname, user, encPass, command) {
    return getStdoutParsed(hostname, user, encPass, command, (s) => s);
}
export function getJSON(hostname, user, encPass, command) {
    return getStdoutParsed(hostname, user, encPass, command, JSON.parse);
}
