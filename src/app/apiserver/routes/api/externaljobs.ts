import Router from 'koa-router'
import { listUserFolders, UserFolder } from 'app/junction/powershell-remote/commands/index.js'
// import type { NodeObj } from 'app/store/model/type/docment.js';
import type { INode } from 'sharedDefinitions/model/node.js'
import { getActiveNodes, getActiveUsers } from 'app/junction/queries.js'
import type { IUser } from 'sharedDefinitions/model/user.js'
import type { Dict } from 'utils/dict.js'
import { IJobInputExternal } from 'sharedDefinitions/model/jobInput.js'
import DirectoryInfoBody from 'sharedDefinitions/api/DirectoryInfoBody.js'
import MetaHandler from 'utils/MetaHandler.js'
import tryRequest from '../../utils/tryRequest.js'

const CONFIG_FILE_NAME = 'abaqusjob_config.json'
async function getJobSettings(users: Dict<string, IUser>, nodes: Dict<string, INode>) {
  function extractSettingFromDir(dir: UserFolder, node: INode) {
    const setting: DirectoryInfoBody<IJobInputExternal> = {
      name: dir.name,
      owner: dir.owner,
      node: node.hostname,
      config: dir.config,
      inputfiles: dir.inputfiles,
      command: { cpus: 0 },
      input: { type: 'external', workingDir: dir.path },
      description: '',
      error: '',
    }
    // config が存在しないときは null か空オブジェクトが来る。空文字列ではない。
    if (!(dir.config === null || Object.keys(dir.config).length === 0)) {
      setting.error = `${CONFIG_FILE_NAME} exists. This may not be to use externally.`
      return setting
    }
    return setting
  }

  return (
    await Promise.all(
      Object.values(nodes).map(async (node) =>
        (await listUserFolders(node, CONFIG_FILE_NAME))
          .filter((_: UserFolder) => Object.keys(users).includes(_.owner))
          .map((dir) => extractSettingFromDir(dir, node))
      )
    )
  ).reduce((ret, sub) => [...ret, ...sub])
}

const meta = new MetaHandler(import.meta)
const router = new Router({ prefix: `/${meta.ParsedPath.name}` })

router.get('/', async (ctx, _next) => {
  await tryRequest(ctx, async () => {
    const users = await getActiveUsers(ctx.request.query.owner as string | undefined)
    const nodes = await getActiveNodes(ctx.request.query.node as string | undefined)
    ctx.body = await getJobSettings(users, nodes)
  })
})

export default router
