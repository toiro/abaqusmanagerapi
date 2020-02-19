import mongoose from 'mongoose';
import UserModel from '~/models/user.js';

const dboption = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

async function test() {
  console.log('start');
  await mongoose.connect('mongodb://localhost:27017/abaqusmanagerdev', dboption);
  console.log('connected');
  const docs = await UserModel.find().exec();
  console.log(docs.map(_ => _.toObject()));
}

test();
