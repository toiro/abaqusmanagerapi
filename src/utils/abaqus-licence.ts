import { JobStatus } from 'model/resources/enums.js';
import NodeModel from 'model/node.js';
import { getDslsstat } from 'utils/powershell-remote/commands/index.js';
import type { Job, JobObj, Node } from 'model/resources/types.js';
import { jobsOnAsObj } from './job-find-queries.js';

/**
 * CPU数に対する使用計算トークン数
 * トークン数 = Int(None×Ncore^0.422)
 * @param { Number } none 1コアで実行する時に使用する計算トークン数
 * @param { Number } ncore コア数、または（CPU+GPU）数
 */
function calc(none: number, ncore: number) {
  return Math.floor(none * ncore ** 0.422);
}

export function calcLicenceForJob(job: Job | JobObj) {
  if (job.input.external && job.input.external.cpus) {
    return calc(5, job.input.external.cpus) * job.input.external.maxConcurrentJobs;
  }
  return calc(5, job.command.cpus);
}

export function calcLicenceForJobs(jobs: (Job | JobObj)[]) {
  return jobs.reduce((sum, job) => sum + calcLicenceForJob(job), 0);
}

/**
 * abaqus dslsstat コマンドの結果から使用中のライセンス数を計算する
 * @param { Object } dslsStatLicenses abaqus dslsstat コマンドの Licence の結果
 */
export function calcLicenceInUseByDslsstat(dslsStatLicenses: any): number {
  return dslsStatLicenses.reduce((sum: number, license: any) => {
    switch (license.Feature) {
      case 'QAX':
        return sum + Number.parseInt(license.InUse);
      case 'QXT':
        return sum + Math.ceil(Number.parseInt(license.InUse) / 10);
      default:
        return sum;
    }
  }, 0);
}

export async function getLicenceInUseByRunningJobs() {
  return calcLicenceForJobs(await jobsOnAsObj(JobStatus.Running));
}

export async function getLicenceInUseByDslsstatFrom(node: Node) {
  return calcLicenceInUseByDslsstat((await getDslsstat(node)).Licenses);
}

export async function getLicenceInUseByDslsstat() {
  const node = (await NodeModel.find().exec())[0];
  return node ? getLicenceInUseByDslsstatFrom(node) : 0;
}
