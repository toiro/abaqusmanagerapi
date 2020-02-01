import config from 'config';
import mongoose from 'mongoose';
import logger from '~/utils/logger.js';

/**
 * config に基づいて mongoDB に接続する
 *
 * @param {function():void} onOpen
 */
export default async() => {
  const dbconfig = config.get('mongo');
  const dboption = {
    useNewUrlParser: true,
    useUnifiedTopology: true
  };

  await mongoose.connect(`mongodb://${dbconfig.host}/${dbconfig.db}`, dboption);

  logger.verbose(`Conecting to mongodb on ${dbconfig.host}/${dbconfig.db}`);

  mongoose.connection.on('error', error => {
    logger.error(error);
  });

  mongoose.connection.on('disconnected', () => {
    logger.verbose(`Disconnected from mongodb on ${dbconfig.host}/${dbconfig.db}`);
  });
};
