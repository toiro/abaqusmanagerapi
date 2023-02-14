import JobModel from '../../app/store/model/job.js';
import UserModel from '../../app/store/model/user.js';
import NodeModel from '../../app/store/model/node.js';
import { arrayToUniquePropDict } from '../../utils/dict.js';
export async function jobsOn(status) {
    const rawObjects = await JobModel.find({ 'status.code': status }).exec();
    return rawObjects;
}
export async function getUser(name) {
    return (await UserModel.findOne({ name }).exec());
}
export async function getActiveUsers(name) {
    const cond = name ? { name } : {};
    // TODO
    return arrayToUniquePropDict((await UserModel.find(cond).exec()), 'name');
}
export async function getWholeUsers() {
    // TODO
    return arrayToUniquePropDict((await UserModel.find().exec()), 'name');
}
export async function getNode(hostname) {
    return (await NodeModel.findOne({ hostname }).exec());
}
export async function getActiveNodes(hostname) {
    const cond = hostname ? { hostname } : {};
    // TODO
    return arrayToUniquePropDict((await NodeModel.find(cond).exec()), 'hostname');
}
export async function getWholeNodes() {
    // TODO
    return (await NodeModel.find({}).exec());
}
