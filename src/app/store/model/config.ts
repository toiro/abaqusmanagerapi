import mongoose from 'mongoose';
import { IConfig, name } from 'model/config.js';

const schema = new mongoose.Schema<IConfig>({
  key: {
    type: String,
    required: true,
    unique: true,
    match: /[a-z0-9_]+/,
    minlength: 2,
  },
  value: {
    type: String,
    required: true,
  },
});

export default mongoose.model<IConfig>(name, schema);
