import mongoose from 'mongoose';
import { JobPriority, JobStatus } from './resources/enums.js';

const name = 'Job';

export interface IJob {
  name: string;
  owner: string;
  createdAt: Date;
  description: string;
  node: string;
  command: {
    cpus: number;
    options: [
      {
        name: string;
        vaule: string;
      }
    ];
  };
  input: {
    sharedDirectory: {
      path: string;
      inputfile: string;
    };
    uploaded: mongoose.Types.ObjectId;
    external: {
      cpus: number;
      maxConcurrentJobs: number;
      readyTimeout: number;
      workingDir: string;
    };
  };
  priority: JobPriority;
  status: {
    code: JobStatus;
    message: string;
    at: Date;
    executeDirectoryPath: string;
    resultDirectoryPath: string;
  };
}

const schema = new mongoose.Schema<IJob>({
  name: { type: String, required: true, match: /^[A-Za-z0-9_-]+$/ },
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
    // 共有ディレクトリにファイル配置
    sharedDirectory: {
      path: { type: String },
      inputfile: { type: String },
    },
    // Webからアップロード
    uploaded: { type: mongoose.Schema.Types.ObjectId },
    // CPU枠を確保して外部実行
    external: {
      cpus: { type: Number },
      maxConcurrentJobs: { type: Number },
      readyTimeout: { type: Number },
      workingDir: { type: String },
    },
  },
  priority: { type: Number, enum: Object.values(JobPriority), default: JobPriority.Middle },
  status: {
    code: { type: String, enum: Object.values(JobStatus), required: true, default: JobStatus.Waiting },
    message: { type: String },
    at: { type: Date, required: true, default: Date.now },
    executeDirectoryPath: { type: String },
    resultDirectoryPath: { type: String },
  },
});

export default mongoose.model<IJob>(name, schema);
