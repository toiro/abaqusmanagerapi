import mongoose from 'mongoose';
import type { ConfigKey } from './resources/enums.js';

const name = 'Config';

export interface IConfig {
  key: ConfigKey;
  value: string;
}

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
