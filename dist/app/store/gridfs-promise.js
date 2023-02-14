import mongoose from 'mongoose';
import { getGridFS } from './connectdb.js';
function wrapId(id) {
    return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}
export default {
    delete(id) {
        const oId = wrapId(id);
        return new Promise((resolve, reject) => {
            getGridFS().delete(oId, (e) => {
                if (e) {
                    reject(e);
                }
                else {
                    resolve();
                }
            });
        });
    },
    findById(id) {
        const oId = wrapId(id);
        return new Promise((resolve, reject) => {
            getGridFS()
                .find({
                _id: oId,
            })
                .toArray((e, files) => {
                if (e) {
                    reject(e);
                }
                else if (!files || files.length === 0) {
                    reject(new Error(`file not found for id: ${id.toString()}`));
                }
                else {
                    resolve(files[0]);
                }
            });
        });
    },
    openDownloadStream(id) {
        const oId = wrapId(id);
        return new Promise((resolve, reject) => {
            // 存在チェック
            getGridFS()
                .find({
                _id: oId,
            })
                .toArray((err, files) => {
                if (err)
                    reject(err);
                if (!files || files.length === 0) {
                    reject(new Error(`file not found for id: ${id}`));
                }
                // ストリームを返す
                resolve(getGridFS().openDownloadStream(oId));
            });
        });
    },
};
