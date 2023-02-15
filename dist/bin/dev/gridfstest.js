import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import connectDb, { getGridFS } from '../../app/store/connectdb.js';
import { logger } from '../../utils/logger.js';
// eslint-disable-next-line no-void
void (async () => {
    try {
        await connectDb();
    }
    catch (error) {
        logger.error(error);
        throw new Error('Failed to Connect Database.');
    }
    const readstream = fs.createReadStream(path.join(process.cwd(), './resources/encript.ps1'));
    readstream.pipe(
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    getGridFS().openUploadStream('testfile', {
        chunkSizeBytes: 1048576,
        metadata: { field: 'myField', value: 'myValue' },
    }));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    const cursor = getGridFS().find({});
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    cursor.forEach((doc) => logger.info(doc._id));
    logger.info('uploaded.');
})();
const BucketName = 'inputfiles';
let gridFS;
export function getGridFS2() {
    // if (mongoose.connection.readyState == 1) return null;
    if (!gridFS)
        gridFS = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: BucketName });
    return gridFS;
}
