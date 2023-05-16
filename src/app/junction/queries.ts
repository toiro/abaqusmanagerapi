import JobModel from 'app/store/model/job.js'
import UserModel from 'app/store/model/user.js'
import NodeModel from 'app/store/model/node.js'
import { arrayToUniquePropDict } from 'utils/dict.js'
import type { JobStatus } from 'sharedDefinitions/model/resources/enums'
import type { IJob } from 'sharedDefinitions/model/job'
import type { IUser } from 'sharedDefinitions/model/user'
import type { INode } from 'sharedDefinitions/model/node'

export async function jobsOn(status: JobStatus) {
  const rawObjects = await JobModel.find({ 'status.code': status }).exec()
  return rawObjects as IJob[]
}

export async function getUser(name: string) {
  return (await UserModel.findOne({ name }).exec()) as IUser
}

export async function getActiveUsers(name?: string) {
  const cond = name ? { name } : {}
  // TODO
  return arrayToUniquePropDict((await UserModel.find(cond).exec()) as IUser[], 'name')
}

export async function getWholeUsers() {
  // TODO
  return arrayToUniquePropDict((await UserModel.find().exec()) as IUser[], 'name')
}

export async function getNode(hostname: string) {
  return (await NodeModel.findOne({ hostname }).exec()) as INode
}

export async function getActiveNodes(hostname?: string) {
  const cond: { isActive: boolean; hostname?: string } = { isActive: true }
  if (hostname) cond.hostname = hostname

  return arrayToUniquePropDict((await NodeModel.find(cond).exec()) as INode[], 'hostname')
}

export async function getWholeNodes() {
  return arrayToUniquePropDict((await NodeModel.find({}).exec()) as INode[], 'hostname')
}

export async function deleteJob(job: IJob) {
  return JobModel.findByIdAndDelete(job._id)
}
