
export default class AbaqusCommandBuilder {
  constructor(param) {
    this._param = param || {};
  }

  set(key, value) {
    this._param[key] = value;
    return this;
  }

  setSourceDir(value) { this.set('sourceDir', value); return this; }
  setDestinationDir(value) { this.set('destinationDir', value); return this; }
  setWorkingDirName(value) { this.set('workingDirName', value); return this; }

  setFileName(value) { this.set('fileName', value); return this; }
  setJobName(value) { this.set('jobName', value); return this; }
  setCpus(value) { this.set('cpus', value); return this; }

  build() {
    const param = {};
    param.jobName = this._param.jobName;
    param.inputFilePath = this._param.inputFilePath;

    const option = [];
    option.push(`cpus ${this._param.cpus}`);
    option.push('interactive');
    param.parsedOption = option.join(' ');

    return build(param);
  }
}

const build = param => `{
  param ($Session)
  Copy-Item –Path '${param.sourceDir}\\${param.workingDirName}\\${param.fileName}' –Destination '${param.destinationDir}\\${param.workingDirName}\\${param.fileName}' –ToSession $Session -Recurse -Force
  Invoke-Command -Session $Session -ScriptBlock  {
  $jobName = "${param.jobname}"
  $input = "${param.destinationDir}\\${param.fileName}"
  $option = "${param.parsedOption}"
  abaqus interactive "job=\${jobName}" "input=\${input}" \${option}
  }
}`;
