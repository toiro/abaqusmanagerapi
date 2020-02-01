import mongoose from 'mongoose';
import schema from './schemas/job.js';

export const JobModel = mongoose.model('Job', schema);

export default {
  addItem: async username => {
    const newUser = new JobModel({
      name: username
    });
    await newUser.save();
    return newUser.toObject();
  },
  getItems: async() => {
    const docs = await JobModel.find().exec();
    return docs.map(doc => doc.toObject());
  },
  getItem: async username => {
    const condition = { name: username };
    const doc = await JobModel.findOne(condition).exec();
    return doc ? doc.toObject() : null;
  },
  deleteItem: async username => {
    const condition = { name: username };
    const doc = await JobModel.findOneAndDelete(condition).exec();
    return doc ? doc.toObject() : null;
  }
};
