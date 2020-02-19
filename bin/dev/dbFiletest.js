import mongoose from 'mongoose';
import fs from 'fs';
import InputFileModel from '~/models/inputfile.js';

const dboption = {
  useNewUrlParser: true,
  useUnifiedTopology: true
};

async function test() {
  console.log('start');
  await mongoose.connect('mongodb://localhost:27017/abaqusmanagerdev', dboption);
  console.log('connected');

  try {
    const dirPath = './';
    const fileName = 'combined.log';
    const content = await fs.promises.readFile(`${dirPath}${fileName}`);
    console.log('load from fs');

    const upload = new InputFileModel({ fileName, content });

    await upload.save();
    console.log('stored to mongo');

    const download = await InputFileModel.findOne({ fileName }).exec();
    console.log('load from mongo');

    await fs.promises.writeFile(`${dirPath}downloaded.log`, download.content);
    console.log('stored to fs');
  } finally {
    await mongoose.connection.close();
    console.log('connection closed');
  }
}

test();
