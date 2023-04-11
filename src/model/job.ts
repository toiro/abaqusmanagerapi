import type mongoose from 'mongoose';
import type { JobPriority, JobStatus } from './resources/enums.js';

export const name = 'Job';

export interface IJob {
  _id: mongoose.Types.ObjectId;
  name: string;
  owner: string;
  createdAt: Date;
  description: string;
  node: string;
  command: {
    cpus: number;
    options: {
      name: string;
      vaule?: string;
    }[];
  };
  input: {
    sharedDirectory?: {
      path: string;
      inputfile: string;
    };
    uploaded?: mongoose.Types.ObjectId;
    external?: {
      cpus: number;
      maxConcurrentJobs: number;
      readyTimeout: number;
      workingDir: string;
    };
  };
  priority: JobPriority;
  status: {
    code: JobStatus;
    at: Date;
    message?: string;
    executeDirectoryPath?: string;
    resultDirectoryPath?: string;
  };
}
