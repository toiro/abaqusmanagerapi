import mongoose from 'mongoose';

/**
 * @type { mongoose.mongo.GridFSBucket }
 */

let _gridfs = null;
function getGridfs() {
  if (mongoose.connection.readyState == 1) return null;
  if (!_gridfs) _gridfs = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'inputfiles' });
  return _gridfs;
}

export default {
  delete(id) {
    const oId = wrapId(id);
    return new Promise((resolve, reject) => {
      getGridfs().delete(oId, error => {
        if (error !== null) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  },
  findById(id) {
    const oId = wrapId(id);
    return new Promise((resolve, reject) => {
      getGridfs()
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
    const oId = wrapId(id);
    return new Promise((resolve, reject) => {
      // 存在チェック
      getGridfs()
        .find({
          _id: oId
        })
        .toArray((err, files) => {
          if (err) reject(err);
          if (!files || files.length === 0) {
            reject(new Error(`file not found for id: ${id}`));
          }
          // ストリームを返す
          resolve(getGridfs().openDownloadStream(oId));
        });
    });
  }
};

function wrapId(id) {
  if (typeof id === 'string') return mongoose.Types.ObjectId(id);
  return id;
}
