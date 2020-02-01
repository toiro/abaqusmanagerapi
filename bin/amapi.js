import config from 'config';
import options from 'commander';
import mongoose from 'mongoose';
import logger from '~/utils/logger.js';
import api from '~/apiserver/index.js';
import connectDb from '~/utils/connectdb.js';

logger.info(`Start on mode:${config.get('env')}`);

options
  .option('-H, --host <host>', `specify the host [${config.get('host')}]`, config.get('host'))
  .option('-p, --port <port>', `specify the port [${config.get('port')}]`, config.get('port'))
  .parse(process.argv);

const app = api();

(async() => {
  try {
    await connectDb();
  } catch (error) {
    logger.error(error);
    throw new Error('Failed to Connect Database.');
  }

  const server = app.listen(options.port, options.host);
  logger.verbose(`Listening on ${options.host}:${options.port}`);

  server.on('close', () => {
    logger.verbose(`Closed listening on ${options.host}:${options.port}`);
  });

  // 終了処理登録
  const gracefulExit = () => {
    mongoose.connection.close(() => {
      server.close(() => {
        logger.info('Exit regularly.');
        process.exit(0);
      });
    });
  };
  process.on('SIGINT', gracefulExit).on('SIGTERM', gracefulExit);
})();
