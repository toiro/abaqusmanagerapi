import mongoose from 'mongoose';

/**
 * @type { mongoose.mongo.GridFSBucket }
 */
const gridfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'inputfiles' });

export default {
  delete(id) {
    const oId = mongoose.Types.ObjectId(id);
    return new Promise((resolve, reject) => {
      gridfs.delete(oId, error => {
        if (error !== null) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
  findById(id) {
    const oId = mongoose.Types.ObjectId(id);
    return new Promise((resolve, reject) => {
      gridfs
        .find({
          _id: oId
        })
        .toArray((err, files) => {
          if (err) reject(err);
          if (!files || files.length === 0) {
            reject(new Error(`file not found for id: ${id}`));
          }
          resolve(files[0]);
        });
    });
  },
  openDownloadStream(id) {
    const oId = mongoose.Types.ObjectId(id);
    return new Promise((resolve, reject) => {
      // 存在チェック
      gridfs
        .find({
          _id: oId
        })
        .toArray((err, files) => {
          if (err) reject(err);
          if (!files || files.length === 0) {
            reject(new Error(`file not found for id: ${id}`));
          }
          // ストリームを返す
          resolve(gridfs.openDownloadStream(oId));
        });
    });
  }
};
