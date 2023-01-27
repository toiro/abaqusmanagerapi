import Router from "koa-router";
import { listUserFolders } from "../../../utils/powershell-remote/commands/index.js";
import { tryRequest, getNodeList, getUserList } from "../_helper.js";
const router = new Router({ prefix: "/externaljobs" });
router.get("/", async (ctx, _next) => {
    await tryRequest(ctx, async () => {
        const users = await getUserList(ctx.request.query.owner);
        const nodes = await getNodeList(ctx.request.query.node);
        ctx.body = await getJobSettings(users, nodes);
    });
});
export default router;
const CONFIG_FILE_NAME = "abaqusjob_config.json";
async function getJobSettings(users, nodes) {
    const settings = [];
    for (const node of nodes) {
        const dirs = (await listUserFolders(node, CONFIG_FILE_NAME)).directories.filter((_) => users.includes(_.owner));
        for (const dir of dirs) {
            const setting = {
                name: dir.name,
                owner: dir.owner,
                node: node.hostname,
                config: dir.config,
                inputfiles: dir.inputfiles,
                command: {
                    cpus: 0,
                },
                input: {
                    external: {
                        workingDir: dir.path,
                    },
                },
                error: "",
            };
            if (!(setting.config === null || Object.keys(setting.config).length === 0)) {
                setting.error = `${CONFIG_FILE_NAME} exists. This may not be to use externally.`;
                settings.push(setting);
                continue;
            }
            settings.push(setting);
        }
    }
    return settings;
}
