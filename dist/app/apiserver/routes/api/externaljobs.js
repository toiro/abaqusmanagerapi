import Router from 'koa-router';
import { listUserFolders } from '../../../../app/junction/powershell-remote/commands/index.js';
import { getActiveNodes, getActiveUsers } from '../../../../app/junction/queries.js';
import { tryRequest } from '../_helper.js';
const CONFIG_FILE_NAME = 'abaqusjob_config.json';
async function getJobSettings(users, nodes) {
    function extractSettingFromDir(dir, node) {
        const setting = {
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
    return (await Promise.all(Object.values(nodes).map(async (node) => (await listUserFolders(node, CONFIG_FILE_NAME))
        .filter((_) => Object.keys(users).includes(_.owner))
        .map((dir) => extractSettingFromDir(dir, node))))).reduce((ret, sub) => [...ret, ...sub]);
}
const router = new Router({ prefix: '/externaljobs' });
router.get('/', async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const users = await getActiveUsers(ctx.request.query.owner);
        const nodes = await getActiveNodes(ctx.request.query.node);
        ctx.body = await getJobSettings(users, nodes);
    });
});
export default router;
