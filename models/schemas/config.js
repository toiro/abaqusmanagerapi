import mongoose from 'mongoose';

export default new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true,
    match: /[a-z0-9_]+/,
    minlength: 2
  },
  value: {
    type: String,
    required: true
  }
});
