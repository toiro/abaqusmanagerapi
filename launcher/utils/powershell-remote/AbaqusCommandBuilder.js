
export default class AbaqusCommandBuilder {
  constructor(param) {
    this._param = param;
  }

  set(key, value) {
    this._param[key] = value;
    return this;
  }

  setJobName(value) { this.set('jobName', value); }
  setInputFilePath(value) { this.set('inputFilePath', value); }
  setCpus(value) { this.set('cpus', value); }

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

const build = param => `param(
  [System.Management.Automation.Runspaces.PSSession]$Session
)

Invoke-Command -Session $Session -ScriptBlock  {
  $jobName = "${param.jobName}"
  $input = "${param.inputFilePath}"
  $option = "${param.parsedOption}"
  abaqus "job=\${jobName}" "input=\${input}" \${option}
}
`;
