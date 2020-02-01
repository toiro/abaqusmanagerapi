import mongoose from 'mongoose';

export default new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    match: /[a-z0-9_]+/,
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
