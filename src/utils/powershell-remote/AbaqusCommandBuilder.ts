
export default class AbaqusCommandBuilder {
  command: string
  _param: { [key: string]: any }

  constructor(command: string, param?: { [key: string]: any }) {
    this.command = command;
    this._param = param || {};
  }

  set(key: string, value: any) {
    this._param[key] = value;
    return this;
  }

  setExecuteDirRoot(value: string) { this.set('executeDirRoot', value); return this; }
  setWorkingDirName(value: string) { this.set('workingDirName', value); return this; }
  setFileName(value: string) { this.set('fileName', value); return this; }
  setJobName(value: string) { this.set('jobName', value); return this; }
  setCpus(value: number) { this.set('cpus', value); return this; }
  setOptions(value: any) { this.set('options', value); return this; }

  build() {
    const param: { [key: string]: string } = {};
    param.jobName = this._param.jobName;
    param.fileName = this._param.fileName;
    param.workingDirName = this._param.workingDirName;
    param.executeDirRoot = this._param.executeDirRoot;

    const options = [];
    options.push(`cpus=${this._param.cpus}`);
    // console.log(this._param.options);
    if (Array.isArray(this._param.options)) {
      for (const option of this._param.options) {
        if (option.value) {
          options.push(`${option.name}=${option.value}`);
        } else {
          options.push(option.name);
        }
      }
    }
    param.parsedOption = options.map(o => `"${o}"`).join(',');
    param.parsedOption = `@(${param.parsedOption})`;

    // console.log(build(param));
    return build(this.command, param);
  }
}

const build = (command: string, param: { [key: string]: string }) => `{
  param ($Session)
  $command = {
    $jobName = "${param.jobName}"
    $input = "${param.executeDirRoot}\\${param.workingDirName}\\${param.fileName}"
    $option = ${param.parsedOption}
    Push-Location "${param.executeDirRoot}\\${param.workingDirName}"
    # interactive で実行すると log ファイルが生成されないため、生成する
    ${command} interactive "job=\${jobName}" "input=\${input}" \${option} | Tee-Object -FilePath ".\\${param.jobName}.log"
    Pop-Location
  }
  if ($Session) {
    Invoke-Command -Session $Session -ScriptBlock $command
  } else {
    Invoke-Command -ScriptBlock $command
  }
}`;
