import path from 'path';
import Router from 'koa-router';
import { tryRequest } from '../_helper.js';
import getContentFromRemote from '~/utils/powershell-remote/commands/getContentFromRemote.js';
import listUserFolders from '~/utils/powershell-remote/commands/listUserFolders.js';
import UserModel from '~/models/user.js';
import NodeModel from '~/models/node.js';

const router = new Router({ prefix: '/jobs' });

router
  .get('/stat/license', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const users = await getUserList(ctx.request.query.name);
      const nodes = await getNodeList(ctx.request.query.name);
      ctx.body = {
        InUse: 10,
        Capacity:100,
      }
    });
  });

export default router;

async function getUserList(param) {
  const cond = param
    ? { hostname: param }
    : {};
  return (await UserModel.find(cond).exec()).map(doc => doc.name);
}

async function getNodeList(param) {
  const cond = param
    ? { hostname: param }
    : {};
  return (await NodeModel.find(cond).exec()).map(doc => doc.toObject());
}

async function getJobSettings(users, nodes) {
  const settings = [];
  for (const node of nodes) {
    const dirs = (await listUserFolders(node)).filter(value => users.includes(value.owner));
    for (const dir of dirs) {
      let setting = null;
      try {
        const content = await getContentFromRemote(node, path.join(dir.path, 'abaqusjob.config.json'));
        const buf = JSON.parse(content);
        setting = {
          name: buf.name,
          description: buf.description,
          command: buf.command,
          input: { sharedDirectoryPath: dir }
        };
      } catch (err) {
        // エラー内容を返す
        setting = {
          error: err,
          input: { sharedDirectoryPath: dir }
        };
      }
      settings.push(setting);
    }
  }
  return settings;
}
