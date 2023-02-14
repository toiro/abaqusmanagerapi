import { JobStatus } from 'model/resources/enums.js';
import { jobsOn } from 'app/junction/queries.js';
import JobPickCriteria from 'app/junction/JobPickerCriteria.js';

export default class JobPicker {
  // async _init() {
  //   const criteria = new JobPickCriteria();
  //   _getStartingJobs = (waitingJobs: Document<unknown>, runningJobs: Document<unknown>) => criteria.judge(waitingJobs, runningJobs)
  //   await criteria.init();
  //   return this;
  // }
  criteria = new JobPickCriteria();

  async pick() {
    // Waiting のジョブを取得し、priority - createdAt 順に並べる
    const waitingJobs = await jobsOn(JobStatus.Waiting);
    if (waitingJobs.length === 0) return [];
    waitingJobs.sort((a, b) =>
      a.priority !== b.priority ? b.priority - a.priority : a.createdAt.getTime() - b.createdAt.getTime()
    );

    const runningJobs = await jobsOn(JobStatus.Running);
    const startingJobs = await jobsOn(JobStatus.Starting);
    const readyJobs = await jobsOn(JobStatus.Ready);

    const countingJobs = runningJobs.concat(startingJobs).concat(readyJobs);

    // 起動条件を満たすジョブを選択する
    await this.criteria.init();
    return this.criteria.judge(waitingJobs, countingJobs);
  }
}
