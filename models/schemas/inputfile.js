import mongoose from 'mongoose';

export default new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  content: {
    type: Buffer,
    required: true
  }
});
