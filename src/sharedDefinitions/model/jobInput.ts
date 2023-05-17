import type mongoose from 'mongoose'

export interface IJobInput {
  type: 'upload' | 'sharedDirectory' | 'external'
}

export interface IJobInputUpload extends IJobInput {
  type: 'upload'
  uploaded: mongoose.Types.ObjectId
}

export interface IJobInputSharedDirectory extends IJobInput {
  type: 'sharedDirectory'
  path: string
  inputfile: string
}

export interface IJobInputExternal extends IJobInput {
  type: 'external'
  cpus: number
  maxConcurrentJobs: number
  readyTimeout: number
  workingDir: string
}
