import config from 'config';
import options from 'commander';
import mongoose from 'mongoose';
import logger from '~/utils/logger.js';
import api from '~/webserver/index.js';

logger.info(`Start in ${config.get('env')}`);

options
  .option('-H, --host <host>', `specify the host [${config.get('host')}]`, config.get('host'))
  .option('-p, --port <port>', `specify the port [${config.get('port')}]`, config.get('port'))
  .parse(process.argv);

// Http サーバー初期化
const app = api();
app.once('ready', () => {
  app.listen(options.port, options.host);
  logger.verbose(`Listening on ${options.host}:${options.port}`);
});

// TODO ジョブランチャー初期化

// DB初期化 ＆ 接続
const dbconfig = config.get('mongo');
const dboption = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};
mongoose.connect(`mongodb://${dbconfig.host}/${dbconfig.db}`, dboption)
  .catch(error => logger.error(`failed to connect to database: ${error}`));
mongoose.connection.on('error', error => {
  logger.error(error);
});

// DB接続を待って開始
mongoose.connection.once('open', () => {
  logger.verbose(`Conecting mongodb to ${dbconfig.host}/${dbconfig.db}`);
  app.emit('ready');
});
