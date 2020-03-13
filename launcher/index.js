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
      // abaqus は「Abaqus の解析はエラーのため終了しました.」というメッセージで終了しても、終了コードは 0
      // なので最終標準出力の内容で完了したかどうかを判定する
      if (msg.match(/Abaqus JOB [^ ]* COMPLETED/)) {
        logger.info(`Completed ${job.owner}'s job: ${job.name}`);
        jobStatusReciever.completed(job, msg, resultDir);
      } else {
        logger.warn(`Aborted ${job.owner}'s job: ${job.name}`);
        jobStatusReciever.errored(job, msg, resultDir);
      }
    });

  // 10秒間隔で実行
  const task = schedule.schedule('*/10 * * * * *',
    async() => {
      const jobs = await picker.pick();
      for (const job of jobs) {
        logger.verbose(`Pick ${job.owner}'s job: ${job.name}`);
        // 非同期に実行
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
