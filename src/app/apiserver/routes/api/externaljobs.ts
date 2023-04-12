import Router from 'koa-router';
import { listUserFolders, UserFolder } from 'app/junction/powershell-remote/commands/index.js';
// import type { NodeObj } from 'app/store/model/type/docment.js';
import type { INode } from 'model/node.js';
import { getActiveNodes, getActiveUsers } from 'app/junction/queries.js';
import type { IUser } from 'model/user.js';
import type { Dict } from 'utils/dict.js';
import tryRequest from '../../utils/tryRequest.js';
import type DirectoryInfoBody from '../../types/DirectoryInfoBody.js';

const CONFIG_FILE_NAME = 'abaqusjob_config.json';
async function getJobSettings(users: Dict<string, IUser>, nodes: Dict<string, INode>) {
  function extractSettingFromDir(dir: UserFolder, node: INode) {
    const setting: DirectoryInfoBody = {
      name: dir.name,
      owner: dir.owner,
      node: node.hostname,
      config: dir.config,
      inputfiles: dir.inputfiles,
      command: { cpus: 0 },
      input: { external: { workingDir: dir.path } },
      description: '',
      error: '',
    };
    // config が存在しないときは null か空オブジェクトが来る。空文字列ではない。
    if (!(dir.config === null || Object.keys(dir.config).length === 0)) {
      setting.error = `${CONFIG_FILE_NAME} exists. This may not be to use externally.`;
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

const router = new Router({ prefix: '/externaljobs' });

router.get('/', async (ctx, _next) => {
  await tryRequest(ctx, async () => {
    const users = await getActiveUsers(ctx.request.query.owner as string | undefined);
    const nodes = await getActiveNodes(ctx.request.query.node as string | undefined);
    ctx.body = await getJobSettings(users, nodes);
  });
});

export default router;
