import mongoose from 'mongoose';
import { DbTypes, GridFsStorage } from 'multer-gridfs-storage';
import type mongodb from 'mongodb';
import appconfig from '../../utils/config.js';
import { logger } from '../../utils/logger.js';
/**
 * config に基づいて mongoDB に接続する
 *
 */
export default async () => {
  const dbconfig = appconfig.mongo;

  mongoose.set('strictQuery', true);
  mongoose.connection.on('error', (error) => {
    logger.error(error);
  });

  mongoose.connection.on('disconnected', () => {
    logger.verbose(`Disconnected from mongodb on ${dbconfig.host}/${dbconfig.db}`);
  });

  await mongoose.connect(`mongodb://${dbconfig.host}/${dbconfig.db}`);
  // await mongoose.connect(`mongodb://${dbconfig.host}/${dbconfig.db}`, dboption);

  logger.verbose(`Conecting to mongodb on ${dbconfig.host}/${dbconfig.db}`);
};

const BucketName = 'inputfiles';

let gridFS: mongodb.GridFSBucket;
export function getGridFS() {
  // if (mongoose.connection.readyState == 1) return null;
  if (!gridFS) gridFS = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BucketName });
  return gridFS;
}

interface IGridFSStorageFile {
  originalname: string;
}

export function getGridFSStorage() {
  return new GridFsStorage({
    db: mongoose.connection as unknown as DbTypes,
    file: (_req, file) => ({
      filename: (file as IGridFSStorageFile).originalname,
      bucketName: BucketName,
    }),
  });
}
