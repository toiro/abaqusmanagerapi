import mongoose from 'mongoose'
import { IJobInputUpload, IJobInputSharedDirectory, IJobInputExternal } from './jobInput.js'
import type { JobPriority, JobStatus } from './resources/enums.js'

export const name = 'Job'

export interface IGJob<Input extends IJobInputUpload | IJobInputSharedDirectory | IJobInputExternal> {
  _id: mongoose.Types.ObjectId
  name: string
  owner: string
  createdAt: Date
  description: string
  node: string
  command: {
    cpus: number
    options?: {
      name: string
      vaule?: string
    }[]
  }
  input: Input
  priority: JobPriority
  status: {
    code: JobStatus
    at: Date
    message?: string
    executeDirectoryPath?: string
    resultDirectoryPath?: string
  }
}

export type IJob = IGJob<IJobInputUpload | IJobInputSharedDirectory | IJobInputExternal>
export type IJobUpload = IGJob<IJobInputUpload>
export type IJobSharedDirectory = IGJob<IJobInputSharedDirectory>
export type IJobExternal = IGJob<IJobInputExternal>
