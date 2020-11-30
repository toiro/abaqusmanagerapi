import Router from 'koa-router';
import { tryRequest } from '../_helper.js';
import { listUserFolders } from '~/utils/powershell-remote/commands/index.js';
import UserModel from '~/models/user.js';
import NodeModel from '~/models/node.js';

const router = new Router({ prefix: '/mountedjobs' });

router
  .get('/', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      const users = await getUserList(ctx.request.query.owner);
      const nodes = await getNodeList(ctx.request.query.node);
      ctx.body = await getJobSettings(users, nodes);
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
async function getJobSettings(users, nodes) {
  const settings = [];
  for (const node of nodes) {
    const dirs = (await listUserFolders(node, CONFIG_FILE_NAME)).directories.filter(_ => users.includes(_.owner));
    for (const dir of dirs) {
      const setting = {};
      setting.input = { sharedDirectory: { path: dir.path } };
      setting.owner = dir.owner;
      setting.node = node.hostname;
      setting.config = dir.config;
      setting.inputfiles = dir.inputfiles;

      // config が存在しないときは null か空オブジェクトが来る。空文字列ではない。
      if (setting.config === null || Object.keys(setting.config).length === 0) {
        setting.error = `${CONFIG_FILE_NAME} cannot read or is empty.`;
        settings.push(setting);
        continue;
      }
      try {
        const buf = JSON.parse(setting.config);
        setting.name = buf.name;
        setting.description = buf.description;
        setting.command = buf.command;
      } catch (err) {
        setting.error = err.message;
        settings.push(setting);
        continue;
      }

      settings.push(setting);
    }
  }
  return settings;
}
