import JobModel from 'app/store/model/job.js';
import UserModel from 'app/store/model/user.js';
import NodeModel from 'app/store/model/node.js';
import { arrayToUniquePropDict } from 'utils/dict.js';
import type { JobStatus } from 'model/resources/enums';
import type { IJob } from 'model/job';
import type { IUser } from 'model/user';
import type { INode } from 'model/node';

export async function jobsOn(status: JobStatus) {
  const rawObjects = await JobModel.find({ 'status.code': status }).exec();
  return rawObjects as IJob[];
}

export async function getUser(name: string) {
  return (await UserModel.findOne({ name }).exec()) as IUser;
}

export async function getActiveUsers(name?: string) {
  const cond = name ? { name } : {};
  // TODO
  return arrayToUniquePropDict((await UserModel.find(cond).exec()) as IUser[], 'name');
}

export async function getWholeUsers() {
  // TODO
  return arrayToUniquePropDict((await UserModel.find().exec()) as IUser[], 'name');
}

export async function getNode(hostname: string) {
  return (await NodeModel.findOne({ hostname }).exec()) as INode;
}

export async function getActiveNodes(hostname?: string) {
  const cond = hostname ? { hostname } : {};
  // TODO
  return arrayToUniquePropDict((await NodeModel.find(cond).exec()) as INode[], 'hostname');
}

export async function getWholeNodes() {
  // TODO
  return (await NodeModel.find({}).exec()) as INode[];
}
