import mongoose from 'mongoose';
import type mongodb from 'mongodb';
import { getGridFSB } from './connectdb.js';

type Id = string | mongoose.Types.ObjectId;

function wrapId(id: Id) {
  return typeof id === 'string' ? new mongoose.Types.ObjectId(id) : id;
}
export default {
  async delete(id: Id) {
    const oId = wrapId(id);
    await getGridFSB().delete(oId);
  },
  async findById(id: Id) {
    const oId = wrapId(id);
    const found = await getGridFSB().find({ _id: oId }).toArray();
    if (!found || found.length === 0) {
      throw new Error(`file not found for id: ${id.toString()}`);
    }
    return found[0] as mongodb.GridFSFile;
  },
  async openDownloadStream(id: Id) {
    const oId = wrapId(id);
    const found = await getGridFSB().find({ _id: oId }).toArray();
    if (!found || found.length === 0) {
      throw new Error(`file not found for id: ${id.toString()}`);
    }
    return getGridFSB().openDownloadStream(oId);
  },
};
