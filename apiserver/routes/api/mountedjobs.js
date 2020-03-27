import path from 'path';
import Router from 'koa-router';
import { tryRequest } from '../_helper.js';
import getContentFromRemote from '~/utils/powershell-remote/commands/getContentFromRemote.js';
import listUserFolders from '~/utils/powershell-remote/commands/listUserFolders.js';
import UserModel from '~/models/user.js';
import NodeModel from '~/models/node.js';

const router = new Router({ prefix: '/mountedjobs' });

router
  .get('/', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const users = await getUserList(ctx.request.query.name);
      const nodes = await getNodeList(ctx.request.query.name);
      ctx.body = await getJobSettings(users, nodes);
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

const CONFIG_FILE_NAME = 'abaqusjob.config.json';
async function getJobSettings(users, nodes) {
  const settings = [];
  for (const node of nodes) {
    const dirs = (await listUserFolders(node)).directories;
    for (const dir of dirs) {
      const setting = {};
      setting.input = { sharedDirectoryPath: dir.path };
      setting.owner = dir.owner;
      setting.node = node.hostname;

      try {
        const content = await getContentFromRemote(node, path.join(dir.path, CONFIG_FILE_NAME));
        if (!content) { throw new Error(`${CONFIG_FILE_NAME} is not exist or empty.`); }
        setting.config = content;
        const buf = JSON.parse(content);

        setting.name = buf.name;
        setting.description = buf.description;
        setting.command = buf.command;
      } catch (err) {
        // エラー内容を返す
        setting.error = err.message;
      }
      settings.push(setting);
    }
  }
  return settings;
}
