import mongoose from 'mongoose';

const name = 'InputFile';

const schema = new mongoose.Schema({
  fileName: { type: String, required: true },
  content: { type: Buffer, required: true }
});

export default mongoose.model(name, schema);
