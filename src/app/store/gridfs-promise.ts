import mongoose from 'mongoose';
import type mongodb from 'mongodb';
import { getGridFS } from './connectdb.js';

type Id = string | mongoose.Types.ObjectId;

function wrapId(id: Id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}
export default {
  delete(id: Id) {
    const oId = wrapId(id);
    return new Promise<void>((resolve, reject) => {
      getGridFS().delete(oId, (e: unknown) => {
        if (e) {
          reject(e);
        } else {
          resolve();
        }
      });
    });
  },
  findById(id: Id) {
    const oId = wrapId(id);
    return new Promise<mongodb.GridFSFile>((resolve, reject) => {
      getGridFS()
        .find({
          _id: oId,
        })
        .toArray((e: unknown, files: mongodb.GridFSFile[]) => {
          if (e) {
            reject(e);
          } else if (!files || files.length === 0) {
            reject(new Error(`file not found for id: ${id.toString()}`));
          } else {
            resolve(files[0] as mongodb.GridFSFile);
          }
        });
    });
  },
  openDownloadStream(id: Id) {
    const oId = wrapId(id);
    return new Promise<mongodb.GridFSBucketReadStream>((resolve, reject) => {
      // 存在チェック
      getGridFS()
        .find({
          _id: oId,
        })
        .toArray((err: any, files: mongodb.GridFSFile[]) => {
          if (err) reject(err);
          if (!files || files.length === 0) {
            reject(new Error(`file not found for id: ${id}`));
          }
          // ストリームを返す
          resolve(getGridFS().openDownloadStream(oId));
        });
    });
  },
};
