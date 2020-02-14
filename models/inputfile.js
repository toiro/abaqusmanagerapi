import mongoose from 'mongoose';

const name = 'InputFile';

const schema = new mongoose.Schema({
  file: {
    filename: { type: String },
    content: { type: Buffer }
  }
});

export default mongoose.model(name, schema);
