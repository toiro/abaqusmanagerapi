import mongoose from 'mongoose';

const name = 'User';

export interface IUser {
  name: string
  maxConcurrentJob: number
}

const schema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    required: true,
    unique: true,
    match: /^[A-Za-z0-9_-]+$/,
    minlength: 2
  },
  maxConcurrentJob: {
    type: Number,
    required: true,
    default: 2,
    min: 1,
    max: 99
  }
});

export default mongoose.model<IUser>(name, schema);
