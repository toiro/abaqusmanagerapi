import schedule from 'node-cron';
import { logger } from '../utils/logger.js';
import JobPicker from './JobPicker.js';
import JobLauncher, { LaunchEvent } from './JobLauncher.js';
import jobStatusReciever from './utils/JobStatuRecieverSingleton.js';
import { jobsOnAsRaw } from '../utils/job-find-queries.js';
import { JobStatus } from '../model/resources/enums.js';
export default async () => {
    // 起動時に Starting / Ready / Running は Missing に
    await scanMissingJobs();
    const picker = new JobPicker();
    const launcher = new JobLauncher()
        .on(LaunchEvent.ERROR, (job, error) => {
        logger.warn(`An error occured on launch ${job.owner}'s job: ${job.name}`, error);
        jobStatusReciever.failed(job, error.msg);
    })
        .on(LaunchEvent.LAUNCH, (job, executeDir) => {
        logger.info(`Launch ${job.owner}'s job: ${job.name}`);
        jobStatusReciever.running(job, executeDir);
    })
        .on(LaunchEvent.FINISH, (job, _code, msg, resultDir) => {
        // abaqus は「Abaqus の解析はエラーのため終了しました.」というメッセージで終了しても、終了コードは 0
        // 逆に解析が正しく終了しても終了コードが 0 ではない場合がある
        // なので最終標準出力の内容で完了したかどうかを判定する
        if (msg.match(/Abaqus JOB [^ ]* COMPLETED/)) {
            logger.info(`Completed ${job.owner}'s job: ${job.name}`);
            jobStatusReciever.completed(job, msg, resultDir);
        }
        else {
            logger.warn(`Aborted ${job.owner}'s job: ${job.name}: ${msg}`);
            jobStatusReciever.failed(job, msg, resultDir);
        }
    });
    launcher.on('queue', (job, count) => {
        logger.verbose(`Queue ${job.owner}'s job: ${job.name} on ${count}th`);
    });
    launcher.on('start', (job, _count) => {
        logger.verbose(`Start ${job.owner}'s job: ${job.name}`);
    });
    // 10秒間隔で実行
    const task = schedule.schedule('*/10 * * * * *', async () => {
        const jobs = await picker.pick();
        for (const job of jobs) {
            logger.verbose(`Pick ${job.owner}'s job: ${job.name}`);
            if (job.toObject().input.external) {
                jobStatusReciever.ready(job);
                // Starting で放置されたものは Missing として後続を実行する
                let timeout = job.input.external.readyTimeout * 60 * 1000;
                if (timeout < 0) {
                    timeout = 1000;
                }
                setTimeout(() => {
                    jobStatusReciever.readyToMissing(job);
                }, timeout);
            }
            else {
                jobStatusReciever.starting(job);
                // 非同期に実行
                launcher.launch(job);
            }
        }
        // checkJobStatus() // TODO ジョブの追跡に失敗していないかを検証する
    }, {
        scheduled: false,
        timezone: 'Asia/Tokyo'
    });
    return task;
};
async function scanMissingJobs() {
    const starting = await jobsOnAsRaw(JobStatus.Starting);
    const ready = await jobsOnAsRaw(JobStatus.Ready);
    const running = await jobsOnAsRaw(JobStatus.Running);
    const toBeMissing = starting.concat(ready).concat(running);
    for (const job of toBeMissing) {
        job.status.code = JobStatus.Missing;
        job.status.message = 'The status is missed because Abaqus Manager was maybe halted while the job was running or starting.';
        job.status.at = new Date();
        await job.save();
    }
}
