import mongoose from 'mongoose';

const name = 'Node';

const schema = new mongoose.Schema({
  hostname: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-z0-9_-]+$/,
    minlength: 2
  },
  maxConcurrentJob: {
    type: Number,
    required: true,
    default: 5,
    min: 1,
    max: 99
  },
  executeDirectoryRoot: { type: String, required: true },
  resultDirectoryRoot: { type: String, required: true },
  importDirectoryRoot: { type: String, required: true },
  winrmCredential: {
    user: { type: String, required: true },
    encryptedPassword: { type: String, required: true }
  }
});

export default mongoose.model(name, schema);
