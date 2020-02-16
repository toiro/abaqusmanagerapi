import config from 'config';
import options from 'commander';
import mongoose from 'mongoose';
import graceful from 'node-graceful';
import logger from '~/utils/logger.js';
import api from '~/apiserver/index.js';
import launcher from '~/launcher/index.js';
import connectDb from '../utils/connectDb.js';

logger.info(`Start on mode:${config.get('env')}`);

options
  .option('-H, --host <host>', `specify the host [${config.get('host')}]`, config.get('host'))
  .option('-p, --port <port>', `specify the port [${config.get('port')}]`, config.get('port'))
  .parse(process.argv);

// graceful.captureExceptions = true;
// graceful.captureRejections = true;
graceful.on('exit', async signal => logger.info(`Recieve exit signal: ${signal}`));

(async() => {
  try {
    await connectDb();
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to Connect Database.');
  }
  graceful.on('exit', () => mongoose.connection.close());

  const appApi = api();
  const server = appApi.listen(options.port, options.host)
    .on('close', () => {
      logger.verbose(`Closed listening on ${options.host}:${options.port}`);
    })
    .on('error', error => {
      logger.error(error);
      graceful.exit();
    });
  graceful.on('exit', () => server.close());

  logger.verbose(`Start listening on ${options.host}:${options.port}`);

  const appLauncher = launcher();
  appLauncher.start();
  graceful.on('exit', () => appLauncher.destroy());
})();
