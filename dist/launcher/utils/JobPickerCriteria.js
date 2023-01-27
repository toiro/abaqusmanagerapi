import UserModel from '../../model/user.js';
import NodeModel from '../../model/node.js';
import storedConfig from '../../utils/storedConfig.js';
import * as licence from '../../utils/abaqus-licence.js';
import { ConfigKey } from '../../model/resources/enums.js';
export default class JobPickCriteria {
    constructor() {
        this.users = {};
        this.nodes = {};
        this.availableToken = 0;
    }
    async init() {
        this.users = (await UserModel.find().exec()).reduce((map, user) => {
            map[user.name] = user;
            return map;
        }, {});
        this.nodes = (await NodeModel.find().exec()).reduce((map, node) => {
            map[node.hostname] = node;
            return map;
        }, {});
        this.availableToken = Number.parseInt(await storedConfig.get(ConfigKey.AvailableTokenCount), 10);
    }
    judge(waitingJobs, runningJobs) {
        const startingJobs = [];
        // process one by one 
        // eslint-disable-next-line no-restricted-syntax
        for (const job of waitingJobs) {
            if (this.judgeJob(job, runningJobs.concat(startingJobs))) {
                startingJobs.push(job);
            }
        }
        return startingJobs;
    }
    judgeJob(job, runningJobs) {
        function countJob(jobs) {
            return jobs.reduce((sum, j) => sum + (j.input.external.maxConcurrentJobs ? j.input.external.maxConcurrentJobs : 1), 0);
        }
        // ユーザー同時実行数
        const user = this.users[job.owner];
        const maxConcurrentJobForUser = user ? user.maxConcurrentJob : 0;
        const ownerCount = countJob(runningJobs.filter((_) => _.owner === job.owner).concat([job]));
        if (ownerCount > maxConcurrentJobForUser)
            return false;
        // サーバー同時実行数
        const node = this.nodes[job.node];
        const maxConcurrentJobForNode = node ? node.maxConcurrentJob : 0;
        const nodeCount = countJob(runningJobs.filter((_) => _.node === job.node).concat([job]));
        if (nodeCount > maxConcurrentJobForNode)
            return false;
        // ライセンス
        const tokenToClaim = licence.calcLicenceForJob(job);
        const tokenInUse = licence.calcLicenceForJobs(runningJobs);
        if (this.availableToken < tokenToClaim + tokenInUse)
            return false;
        return true;
    }
}
