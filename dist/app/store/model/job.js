import mongoose from 'mongoose';
import { name } from '../../../model/job.js';
import { JobPriority, JobStatus } from '../../../model/resources/enums.js';
const schema = new mongoose.Schema({
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
        at: { type: Date, required: true, default: Date.now },
        message: { type: String },
        executeDirectoryPath: { type: String },
        resultDirectoryPath: { type: String },
    },
});
export default mongoose.model(name, schema);
