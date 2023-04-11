import { JobStatus } from 'model/resources/enums.js';
import NodeModel from 'app/store/model/node.js';
import { DslsStatLicense, getDslsstat } from 'app/junction/powershell-remote/commands/index.js';
import { jobsOn } from 'app/junction/queries.js';
import type { IJob } from 'model/job';
import type { INode } from 'model/node';

/**
 * CPU数に対する使用計算トークン数
 * トークン数 = Int(None×Ncore^0.422)
 * @param { Number } none 1コアで実行する時に使用する計算トークン数
 * @param { Number } ncore コア数、または（CPU+GPU）数
 */
function calc(none: number, ncore: number) {
  return Math.floor(none * ncore ** 0.422);
}

export function calcLicenceForJob(job: IJob) {
  if (job.input.external && job.input.external.cpus) {
    return calc(5, job.input.external.cpus) * job.input.external.maxConcurrentJobs;
  }
  return calc(5, job.command.cpus);
}

export function calcLicenceForJobs(jobs: IJob[]) {
  return jobs.reduce((sum, job) => sum + calcLicenceForJob(job), 0);
}

/**
 * abaqus dslsstat コマンドの結果から使用中のライセンス数を計算する
 * @param { Object } dslsStatLicenses abaqus dslsstat コマンドの Licence の結果
 */
export function calcLicenceInUseByDslsstat(dslsStatLicenses: DslsStatLicense[]): number {
  return dslsStatLicenses.reduce((sum: number, license: DslsStatLicense) => {
    switch (license.Feature) {
      case 'QAX':
        return sum + Number.parseInt(license.InUse, 10);
      case 'QXT':
        return sum + Math.ceil(Number.parseInt(license.InUse, 10) / 10);
      default:
        return sum;
    }
  }, 0);
}

export async function getLicenceInUseByRunningJobs() {
  return calcLicenceForJobs(await jobsOn(JobStatus.Running));
}

export async function getLicenceInUseByDslsstatFrom(node: INode) {
  return calcLicenceInUseByDslsstat((await getDslsstat(node)).Licenses);
}

export async function getLicenceInUseByDslsstat() {
  const node = (await NodeModel.find().exec())[0]; // TODO get from license server setting
  return node ? getLicenceInUseByDslsstatFrom(node) : 0;
}
