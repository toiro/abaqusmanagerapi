import schedule from 'node-cron';
import logger from '~/utils/logger.js';
import Launcher from './launcher.js';

export default opt => {
  const launcher = new Launcher()
    .on('error', error => logger.error(error));

  const task = schedule.schedule('* * * * *',
    () => launcher.invoke(),
    {
      scheduled: false,
      timezone: 'Asia/Tokyo'
    });

  return task;
};
