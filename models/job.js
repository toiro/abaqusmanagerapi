import mongoose from 'mongoose';
import JobPriority from './enums/job-priority.js';
import JobStatus from './enums/job-status.js';

const name = 'Job';

const schema = new mongoose.Schema({
  name: { type: String, required: true, match: /^[A-Za-z0-9_-]+$/ },
  owner: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  description: String,
  node: { type: String, required: true },
  command: {
    cpus: { type: Number, required: true },
    options: [{
      option: { type: String, required: true },
      param: String
    }]
  },
  input: {
    sharedDirectoryPath: { type: String },
    uploaded: { type: mongoose.Schema.Types.ObjectId }
  },
  priority: { type: Number, enum: Object.values(JobPriority), default: JobPriority.Middle },
  status: {
    code: { type: String, required: true, default: JobStatus.Waiting },
    message: { type: String },
    at: { type: Date, required: true, default: Date.now },
    licenseInUse: { type: Number },
    executeDirectoryPath: { type: String },
    resultDirectoryPath: { type: String }
  }
});

export default mongoose.model(name, schema);
