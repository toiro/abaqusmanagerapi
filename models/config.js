import mongoose from 'mongoose';
import schema from './schemas/config.js';

export const ConfigModel = mongoose.model('Config', schema);

export default {
  addItem: async({ key, value }) => {
    const newConfig = new ConfigModel({
      key: key,
      value: value
    });
    await newConfig.save();
    return newConfig.toObject();
  },
  getItems: async() => {
    const docs = await ConfigModel.find().exec();
    return docs.map(doc => doc.toObject());
  },
  getItem: async key => {
    const condition = { key: key };
    const doc = await ConfigModel.findOne(condition).exec();
    return doc ? doc.toObject() : null;
  },
  deleteItem: async key => {
    const condition = { key: key };
    const doc = await ConfigModel.findOneAndDelete(condition).exec();
    return doc ? doc.toObject() : null;
  },
  updateItem: async({ key, value }) => {
    const condition = { key: key };
    const update = { value: value };
    const doc = await ConfigModel.findOneAndUpdate(condition, update, { new: true });
    return doc ? doc.toObject() : null;
  }
};
