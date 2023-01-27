import mongoose from 'mongoose';

const name = 'Node';

export interface INode {
  hostname: string
  maxConcurrentJob: number
  executeDirectoryRoot: string
  resultDirectoryRoot: string
  importDirectoryRoot: string
  winrmCredential: {
    user: string
    encryptedPassword: string
  }
}

const schema = new mongoose.Schema<INode>({
  hostname: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9_.-]+$/,
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

export default mongoose.model<INode>(name, schema);
