import JobStatus from '~/models/enums/job-status.js';
import NodeModel from '~/models/node.js';
import * as queries from '~/utils/job-find-queries.js';
import getDslsstat from '~/utils/powershell-remote/commands/getDslsstat.js';

/**
 * CPU数に対する使用計算トークン数
 * トークン数 = Int(None×Ncore^0.422)
 * @param { Number } none 1コアで実行する時に使用する計算トークン数
 * @param { Number } ncore コア数、または（CPU+GPU）数
 */
function calc(none, ncore) {
  return Math.floor(none * Math.pow(ncore, 0.422));
}

export function calcLicenceForJob(job) {
  return calc(5, job.command.cpus);
}

export function calcLicenceForJobs(jobs) {
  return jobs.reduce((sum, job) => sum + calcLicenceForJob(job), 0);
}

/**
 * abaqus dslsstat コマンドの結果から使用中のライセンス数を計算する
 * @param { Object } dslsStatLicenses abaqus dslsstat コマンドの Licence の結果
 */
export function calcLicenceInUseByDslsstat(dslsStatLicenses) {
  return dslsStatLicenses.reduce((sum, license) => {
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
  return calcLicenceForJobs(await queries.jobsOn(JobStatus.Running));
}

export async function getLicenceInUseByDslsstatFrom(node) {
  return calcLicenceInUseByDslsstat((await getDslsstat(node)).Licenses);
}

export async function getLicenceInUseByDslsstat() {
  const node = (await NodeModel.find().exec())[0];
  return getLicenceInUseByDslsstatFrom(node);
}
