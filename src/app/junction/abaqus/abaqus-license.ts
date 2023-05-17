import { JobStatus } from 'sharedDefinitions/model/resources/enums.js';
import NodeModel from 'app/store/model/node.js';
import { DslsStatLicense, getDslsstat } from 'app/junction/powershell-remote/commands/index.js';
import { jobsOn } from 'app/junction/queries.js';
import type { IJob } from 'sharedDefinitions/model/job';
import type { INode } from 'sharedDefinitions/model/node';
import { useSettingReadOnly } from '../Setting.js';

/**
 * CPU数に対する使用計算トークン数
 * トークン数 = Int(None×Ncore^0.422)
 * @param { Number } none 1コアで実行する時に使用する計算トークン数
 * @param { Number } ncore コア数、または（CPU+GPU）数
 */
function calc(none: number, ncore: number) {
  return Math.floor(none * ncore ** 0.422);
}

export function calcLicenseForJob(job: IJob) {
  if (job.input.type === 'external') {
    return calc(5, job.input.cpus) * job.input.maxConcurrentJobs;
  }
  return calc(5, job.command.cpus);
}

export function calcLicenseForJobs(jobs: IJob[]) {
  return jobs.reduce((sum, job) => sum + calcLicenseForJob(job), 0);
}

/**
 * abaqus dslsstat コマンドの結果から使用中のライセンス数を計算する
 * @param { Object } dslsStatLicenses abaqus dslsstat コマンドの License の結果
 */
export function calcLicenseInUseByDslsstat(dslsStatLicenses: DslsStatLicense[]): number {
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

export async function getLicenseInUseByRunningJobs() {
  return calcLicenseForJobs(await jobsOn(JobStatus.Running));
}

async function getLicenseInUseByDslsstatFrom(node: INode) {
  return calcLicenseInUseByDslsstat((await getDslsstat(node)).Licenses);
}

export async function getLicenseInUseByDslsstat() {
  const licenseSever = (await useSettingReadOnly()).licenseServer;
  const node = await NodeModel.findOne({ hostname: licenseSever.hostname }).exec();
  return node ? getLicenseInUseByDslsstatFrom(node) : 0;
}
