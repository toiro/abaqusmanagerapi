import schedule from 'node-cron';
import logger from '~/utils/logger.js';
import JobPicker from './JobPicker.js';
import JobLauncher from './JobLauncher.js';
import jobStatusReciever from './utils/JobStatuRecieverSingleton.js';
import * as queries from '~/utils/job-find-queries.js';
import STATUS from '~/models/enums/job-status.js';

export default async opt => {
  // 起動時に Starting / Ready / Running は Missing に
  await scanMissingJobs();

  const picker = new JobPicker();

  const launcher = new JobLauncher()
    .on('error', (job, error) => {
      logger.warn(`An error occured on launch ${job.owner}'s job: ${job.name}`, error);
      jobStatusReciever.failed(job, error.msg);
    })
    .on('launch', (job, executeDir) => {
      logger.info(`Launch ${job.owner}'s job: ${job.name}`);
      jobStatusReciever.running(job, executeDir);
    })
    .on('finish', (job, code, msg, resultDir) => {
      // abaqus は「Abaqus の解析はエラーのため終了しました.」というメッセージで終了しても、終了コードは 0
      // なので最終標準出力の内容で完了したかどうかを判定する
      if (msg.match(/Abaqus JOB [^ ]* COMPLETED/)) {
        logger.info(`Completed ${job.owner}'s job: ${job.name}`);
        jobStatusReciever.completed(job, msg, resultDir);
      } else {
        logger.warn(`Aborted ${job.owner}'s job: ${job.name}: ${msg}`);
        jobStatusReciever.failed(job, msg, resultDir);
      }
    });

  launcher.on('queue', (job, count) => {
    logger.verbose(`Queue ${job.owner}'s job: ${job.name} on ${count}th`);
  });
  launcher.on('start', (job, count) => {
    logger.verbose(`Start ${job.owner}'s job: ${job.name}`);
  });

  // 10秒間隔で実行
  const task = schedule.schedule('*/10 * * * * *',
    async() => {
      const jobs = await picker.pick();
      for (const job of jobs) {
        logger.verbose(`Pick ${job.owner}'s job: ${job.name}`);
        if (job.toObject().input.external) {
          jobStatusReciever.ready(job);
          // Starting で放置されたものは Missing として後続を実行する
          let timeout = job.input.external.readyTimeout * 60 * 1000;
          if (timeout < 0) { timeout = 1000; }
          setTimeout(() => {
            jobStatusReciever.readyToMissing(job);
          }, timeout);
        } else {
          jobStatusReciever.starting(job);
          // 非同期に実行
          launcher.launch(job);
        }
      }
      // checkJobStatus() // TODO ジョブの追跡に失敗していないかを検証する
    },
    {
      scheduled: false,
      timezone: 'Asia/Tokyo'
    });

  return task;
};

async function scanMissingJobs() {
  const starting = await queries.jobsOn(STATUS.Starting, true);
  const ready = await queries.jobsOn(STATUS.Ready, true);
  const running = await queries.jobsOn(STATUS.Running, true);

  const toBeMissing = starting.concat(ready).concat(running);

  for (const job of toBeMissing) {
    job.status = {
      code: STATUS.Missing,
      message: 'The status is missed because Abaqus Manager was maybe halted while the job was running or starting.',
      at: Date.now()
    };
    await job.save();
  }
}
