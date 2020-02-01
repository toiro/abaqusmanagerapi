import mongoose from 'mongoose';

export default new mongoose.Schema({
  owner: String,
  createdAt: { type: Date, required: true },
  state: {
    startedAt: Date,
    finishedAt: Date,
    running: Boolean
  },
  command: [{ option: String, param: String }],
  priority: { type: Number, enum: [1, 2, 3, 4, 5], default: 3 }
});
