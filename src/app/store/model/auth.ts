import mongoose from 'mongoose';
import { IAuth, name } from 'sharedDefinitions/model/auth.js';

const schema = new mongoose.Schema<IAuth>({
  type: { type: String, required: true, enum: ['system'] },
  key: {
    type: String,
    required: true,
    unique: true,
    match: /[A-Za-z0-9_-]+/,
    minlength: 2,
  },
  code: {
    type: String,
    required: true,
  },
});

export default mongoose.model<IAuth>(name, schema);
