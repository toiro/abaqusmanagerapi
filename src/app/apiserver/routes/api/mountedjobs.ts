import Router from 'koa-router';
import { listUserFolders, UserFolder } from 'app/junction/powershell-remote/commands/index.js';
import type { INode } from 'model/node.js';
import type { IUser } from 'model/user.js';
import { getActiveUsers, getActiveNodes } from 'app/junction/queries.js';
import type { UniquePropDict } from 'utils/dict.js';
import tryRequest from '../../utils/tryRequest.js';
import type JobConfig from '../../types/JobConfig.js';
import type DirectoryInfoBody from '../../types/DirectoryInfoBody.js';

const CONFIG_FILE_NAME = 'abaqusjob_config.json';
async function getJobSettings(users: UniquePropDict<'name', IUser>, nodes: UniquePropDict<'hostname', INode>) {
  function extractSettingFromDir(dir: UserFolder, node: INode) {
    const setting: DirectoryInfoBody = {
      name: dir.name,
      owner: dir.owner,
      node: node.hostname,
      config: dir.config,
      inputfiles: dir.inputfiles,
      command: {},
      input: { sharedDirectory: { path: dir.path } },
      description: '',
      error: '',
    };
    // config が存在しないときは null か空オブジェクトが来る。空文字列ではない。
    if (dir.config === null || Object.keys(dir.config).length === 0) {
      setting.error = `${CONFIG_FILE_NAME} cannot read or is empty.`;
      return setting;
    }
    try {
      const buf = JSON.parse(dir.config) as JobConfig;
      setting.name = buf.name ? buf.name : setting.name;
      setting.description = buf.description ? buf.description : '';
      setting.command = buf.command ? buf.command : {};
    } catch (err) {
      if (err instanceof Error) setting.error = err.message;
      else setting.error = `Failed to parse ${CONFIG_FILE_NAME}.`;
      return setting;
    }

    return setting;
  }

  return (
    await Promise.all(
      Object.values(nodes).map(async (node) =>
        (await listUserFolders(node, CONFIG_FILE_NAME))
          .filter((_: UserFolder) => Object.keys(users).includes(_.owner))
          .map((dir) => extractSettingFromDir(dir, node))
      )
    )
  ).reduce((ret, sub) => [...ret, ...sub]);
}

const router = new Router({ prefix: '/mountedjobs' });

router.get('/', async (ctx, _next) => {
  await tryRequest(ctx, async () => {
    const users = await getActiveUsers(ctx.request.query.owner as string | undefined);
    const nodes = await getActiveNodes(ctx.request.query.node as string | undefined);
    ctx.body = await getJobSettings(users, nodes);
  });
});

export default router;
