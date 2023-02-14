// @ts-nocheck
import mongoose from 'mongoose';
import { GridFsStorage } from 'multer-gridfs-storage';
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
let gridFS;
export function getGridFS() {
    // if (mongoose.connection.readyState == 1) return null;
    if (!gridFS)
        gridFS = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BucketName });
    return gridFS;
}
let storage;
export function getGridFSStorage() {
    if (!storage)
        storage = new GridFsStorage({
            db: mongoose.connection,
            file: (_req, file) => ({
                filename: file.originalname,
                bucketName: BucketName,
            }),
        });
    return storage;
}
