import mongoose from 'mongoose';
import { INode, name } from 'sharedDefinitions/model/node.js';

const schema = new mongoose.Schema<INode>({
  hostname: {
    type: String,
    required: true,
    unique: true,
    match: /^[a-zA-Z0-9_.-]+$/,
    minlength: 2,
  },
  availableCPUs: {
    type: Number,
    required: true,
    default: 4,
    min: 0,
    max: 99,
  },
  licenseTokenQuota: {
    type: Number,
    required: true,
    default: 30,
    min: 0,
  },
  executeDirectoryRoot: { type: String, required: true },
  resultDirectoryRoot: { type: String, required: true },
  importDirectoryRoot: { type: String, required: true },
  winrmCredential: {
    user: { type: String, required: true },
    encryptedPassword: { type: String, required: true },
  },
  isActive: { type: Boolean, required: true },
});

export default mongoose.model<INode>(name, schema);
