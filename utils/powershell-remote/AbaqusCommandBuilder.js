
export default class AbaqusCommandBuilder {
  constructor(param) {
    this._param = param || {};
  }

  set(key, value) {
    this._param[key] = value;
    return this;
  }

  setExecuteDirRoot(value) { this.set('executeDirRoot', value); return this; }
  setWorkingDirName(value) { this.set('workingDirName', value); return this; }
  setFileName(value) { this.set('fileName', value); return this; }
  setJobName(value) { this.set('jobName', value); return this; }
  setCpus(value) { this.set('cpus', value); return this; }

  build() {
    const param = {};
    param.jobName = this._param.jobName;
    param.fileName = this._param.fileName;
    param.workingDirName = this._param.workingDirName;
    param.executeDirRoot = this._param.executeDirRoot;

    const options = [];
    options.push(`cpus=${this._param.cpus}`);
    param.parsedOption = options.map(o => `"${o}"`).join(',');
    param.parsedOption = `@(${param.parsedOption})`;

    // console.log(build(param));
    return build(param);
  }
}

const build = param => `{
  param ($Session)
  Invoke-Command -Session $Session -ScriptBlock  {
    $jobName = "${param.jobName}"
    $input = "${param.executeDirRoot}\\${param.workingDirName}\\${param.fileName}"
    $option = ${param.parsedOption}
    Push-Location "${param.executeDirRoot}\\${param.workingDirName}"
    # interactive で実行すると log ファイルが生成されないため、生成する
    abaqus interactive "job=\${jobName}" "input=\${input}" \${option} | Tee-Object -FilePath ".\\${param.jobName}.log"
    Pop-Location
  }
}`;
