import mongoose from 'mongoose';

/**
 * @type { mongoose.mongo.GridFSBucket }
 */
const gridfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'inputfiles' });

export default {
  delete(id) {
    return new Promise((resolve, reject) => {
      gridfs.delete(id, error => {
        if (error !== null) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }
};
