import Router from 'koa-router';
import { tryRequest } from '../_helper.js';
import listUserFolders from '~/utils/powershell-remote/commands/listUserFolders.js';
import UserModel from '~/models/user.js';
import NodeModel from '~/models/node.js';

const router = new Router({ prefix: '/externaljobs' });

router
  .get('/', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const users = await getUserList(ctx.request.query.owner);
      const nodes = await getNodeList(ctx.request.query.node);
      const config = ctx.request.query.config ? (ctx.request.query.config === 'true') : true;
      ctx.body = await getJobSettings(users, nodes, config);
    });
  });

export default router;

async function getUserList(name) {
  const cond = name
    ? { name }
    : {};
  return (await UserModel.find(cond).exec()).map(doc => doc.name);
}

async function getNodeList(hostname) {
  const cond = hostname
    ? { hostname }
    : {};
  return (await NodeModel.find(cond).exec()).map(doc => doc.toObject());
}

const CONFIG_FILE_NAME = 'abaqusjob_config.json';
async function getJobSettings(users, nodes, config) {
  const settings = [];
  for (const node of nodes) {
    const dirs = (await listUserFolders(node, CONFIG_FILE_NAME)).directories.filter(_ => users.includes(_.owner));
    for (const dir of dirs) {
      const setting = {};
      setting.name = dir.name;
      setting.description = dir.path;
      setting.owner = dir.owner;
      setting.node = node.hostname;
      setting.config = dir.config;
      setting.inputfiles = dir.inputfiles;

      if (setting.config) {
        setting.error = `${CONFIG_FILE_NAME} exists. This may not be to use externally.`;
        settings.push(setting);
        continue;
      }

      settings.push(setting);
    }
  }
  return settings;
}
