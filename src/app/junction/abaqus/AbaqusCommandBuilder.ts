type FixedAbaqusCommandParameter = {
  jobName: string;
  executeDirRoot: string;
  workingDirName: string;
  fileName: string;
  parsedOption: string;
};

const build = (command: string, param: FixedAbaqusCommandParameter) => `{
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

export type AbaqusCommandParameter = {
  jobName: string;
  executeDirRoot: string;
  workingDirName: string;
  fileName: string;
  cpus: number;
};

export default class AbaqusCommandBuilder {
  command: string;

  param: AbaqusCommandParameter;

  options?: { name: string; value?: string } | { name: string; value?: string }[];

  constructor(
    command: string,
    param: AbaqusCommandParameter,
    options?: { name: string; value?: string } | { name: string; value?: string }[]
  ) {
    this.command = command;
    this.param = param || {};
    if (options) this.options = options;
  }

  build() {
    const options: string[] = [];
    options.push(`cpus=${this.param.cpus}`);
    // console.log(this.param.options);
    if (Array.isArray(this.options)) {
      this.options.forEach((o) => {
        options.push(o.value ? `${o.name}=${o.value}` : o.name);
      });
    }
    const joinedOptions = options.map((o) => `"${o}"`).join(',');

    const param: FixedAbaqusCommandParameter = {
      jobName: this.param.jobName,
      fileName: this.param.fileName,
      workingDirName: this.param.workingDirName,
      executeDirRoot: this.param.executeDirRoot,
      parsedOption: `@(${joinedOptions})`,
    };

    // console.log(build(param));
    return build(this.command, param);
  }
}
