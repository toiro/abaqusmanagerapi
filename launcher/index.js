import schedule from 'node-cron';
import logger from '~/utils/logger.js';
import JobPicker from './JobPicker.js';
import JobLauncher from './JobLauncher.js';
import jobStatusReciever from './utils/JobStatuRecieverSingleton.js';

export default async opt => {
  const picker = new JobPicker();

  const launcher = new JobLauncher()
    .on('launch', (job, executeDir) => {
      logger.info(`Start ${job.owner}'s job: ${job.name}`);
      jobStatusReciever.running(job, executeDir);
    })
    .on('error', (job, error) => {
      logger.warn(`An error occured on launch ${job.owner}'s job: ${job.name}`, error);
      jobStatusReciever.errored(job, error.msg);
    })
    .on('finish', (job, code, msg, resultDir) => {
      // abaqus は「Abaqus の解析はエラーのため終了しました.」というメッセージで終了しても、終了コードは
      if (msg.match(/Abaqus JOB [^ ]* COMPLETED/)) {
        logger.info(`Completed ${job.owner}'s job: ${job.name}`);
        jobStatusReciever.completed(job, msg, resultDir);
      } else {
        logger.warn(`Aborted ${job.owner}'s job: ${job.name}`);
        jobStatusReciever.errored(job, msg, resultDir);
      }
    });

  const task = schedule.schedule('* * * * *',
    async() => {
      const jobs = await picker.pick();
      for (const job of jobs) {
        logger.verbose(`Starting ${job.owner}'s job: ${job.name}`);
        launcher.launch(job);
      }
      // checkJobStatus() // TODO ジョブの追跡に失敗していないかを検証する
    },
    {
      scheduled: false,
      timezone: 'Asia/Tokyo'
    });

  return task;
};
