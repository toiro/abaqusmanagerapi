import mongoose from 'mongoose';
import { IJob, name } from 'sharedDefinitions/model/job.js';
import { JobPriority, JobStatus } from 'sharedDefinitions/model/resources/enums.js';

const schema = new mongoose.Schema<IJob>({
  name: { type: String, required: true, match: /^(?!\s|[.]{2,})[^\\/:*"?<>|]{1,100}$/ },
  owner: { type: String, required: true },
  createdAt: { type: Date, required: true, default: Date.now },
  description: String,
  node: { type: String, required: true },
  command: {
    cpus: { type: Number, required: true },
    options: [
      {
        name: { type: String, required: true },
        value: String,
      },
    ],
  },
  input: {
    type: { type: String, required: true, enum: ['upload', 'sharedDirectory', 'external'] },
    // 共有ディレクトリにファイル配置
    path: { type: String },
    inputfile: { type: String },
    // Webからアップロード
    uploaded: { type: mongoose.Schema.Types.ObjectId },
    // CPU枠を確保して外部実行
    cpus: { type: Number },
    maxConcurrentJobs: { type: Number },
    readyTimeout: { type: Number },
    workingDir: { type: String },
  },
  priority: { type: Number, enum: Object.values(JobPriority), default: JobPriority.Middle },
  status: {
    code: { type: String, enum: Object.values(JobStatus), required: true, default: JobStatus.Waiting },
    at: { type: Date, required: true, default: Date.now },
    message: { type: String },
    executeDirectoryPath: { type: String },
    resultDirectoryPath: { type: String },
  },
});

export default mongoose.model<IJob>(name, schema);
