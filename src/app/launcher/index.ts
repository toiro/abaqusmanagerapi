import schedule from 'node-cron';
import { logger } from 'utils/logger.js';
import { jobsOn } from 'app/junction/queries.js';
import { JobStatus } from 'model/resources/enums.js';
import jobStatusReciever from 'app/junction/JobStatuRecieverSingleton.js';
import type { IJob } from 'model/job.js';
import type { Document } from 'mongoose';
import JobPicker from './JobPicker.js';
import JobLauncher, { LaunchEventName } from './JobLauncher.js';

async function scanMissingJobs() {
  const starting = await jobsOn(JobStatus.Starting);
  const ready = await jobsOn(JobStatus.Ready);
  const running = await jobsOn(JobStatus.Running);

  const toBeMissing = starting.concat(ready).concat(running);
  toBeMissing.forEach((job) => {
    jobStatusReciever.missing(
      job,
      'The status is missed because Abaqus Manager was maybe halted while the job was running or starting.'
    );
  });
}

export default async () => {
  // 起動時に Starting / Ready / Running は Missing に
  await scanMissingJobs();

  const picker = new JobPicker();

  const launcher = new JobLauncher()
    .on(LaunchEventName.ERROR, (job: IJob, error: Error) => {
      logger.warn(`An error occured on launch ${job.owner}'s job: ${job.name}`, error);
      jobStatusReciever.failed(job, error.message);
    })
    .on(LaunchEventName.LAUNCH, (job: IJob, executeDir: string) => {
      logger.info(`Launch ${job.owner}'s job: ${job.name}`);
      jobStatusReciever.running(job, executeDir);
    })
    .on(LaunchEventName.FINISH, (job: IJob, _code: number, msg: string, resultDir: string) => {
      // abaqus は「Abaqus の解析はエラーのため終了しました.」というメッセージで終了しても、終了コードは 0
      // 逆に解析が正しく終了しても終了コードが 0 ではない場合がある
      // なので最終標準出力の内容で完了したかどうかを判定する
      if (msg.match(/Abaqus JOB [^ ]* COMPLETED/)) {
        logger.info(`Completed ${job.owner}'s job: ${job.name}`);
        jobStatusReciever.completed(job, msg, resultDir);
      } else {
        logger.warn(`Aborted ${job.owner}'s job: ${job.name}: ${msg}`);
        jobStatusReciever.failed(job, msg, resultDir);
      }
    });

  launcher.on('queue', (job: IJob, count: number) => {
    logger.verbose(`Queue ${job.owner}'s job: ${job.name} on ${count}th`);
  });
  launcher.on('start', (job: IJob, _count: number) => {
    logger.verbose(`Start ${job.owner}'s job: ${job.name}`);
  });

  // 10秒間隔で実行
  const task = schedule.schedule(
    '*/10 * * * * *',
    async () => {
      const jobs = await picker.pick();
      jobs.forEach((job) => {
        // TODO refactor
        logger.verbose(`Pick ${job.owner}'s job: ${job.name}`);

        if (job.input.external && !(job.input.external as unknown as Document).$isEmpty('')) {
          jobStatusReciever.ready(job);
          // Ready で放置されたものは Missing として後続を実行する
          let timeout = job.input.external.readyTimeout * 60 * 1000;
          if (timeout < 0) {
            timeout = 1000;
          }
          setTimeout(() => {
            jobStatusReciever.readyToMissing(job);
          }, timeout);
        } else {
          jobStatusReciever.starting(job);
          // 非同期に実行
          launcher.launch(job);
        }
      });
      // checkJobStatus() // TODO ジョブの追跡に失敗していないかを検証する
    },
    {
      scheduled: false,
      timezone: 'Asia/Tokyo',
    }
  );

  return task;
};
