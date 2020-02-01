import mongoose from 'mongoose';
import schema from './schemas/user.js';

export const UserModel = mongoose.model('User', schema);

export default {
  addItem: async username => {
    const newUser = new UserModel({
      name: username
    });
    await newUser.save();
    return newUser.toObject();
  },
  getItems: async() => {
    const docs = await UserModel.find().exec();
    return docs.map(doc => doc.toObject());
  },
  getItem: async username => {
    const condition = { name: username };
    const doc = await UserModel.findOne(condition).exec();
    return doc ? doc.toObject() : null;
  },
  deleteItem: async username => {
    const condition = { name: username };
    const doc = await UserModel.findOneAndDelete(condition).exec();
    return doc ? doc.toObject() : null;
  }
};
