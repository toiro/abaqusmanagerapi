import mongoose from 'mongoose';
import UserModel from '../../model/user.js';
async function test() {
    console.log('start');
    await mongoose.connect('mongodb://127.0.0.1:27017/abaqusmanagerdev');
    console.log('connected');
    const docs = await UserModel.find().exec();
    console.log(docs.map(_ => _.toObject()));
}
test();
