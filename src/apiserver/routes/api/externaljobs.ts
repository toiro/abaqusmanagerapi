import Router from "koa-router";
import { listUserFolders } from "utils/powershell-remote/commands/index.js";
import type { NodeObj } from "model/resources/types.js";
import { tryRequest, getNodeList, getUserList } from "../_helper.js";

const router = new Router({ prefix: "/externaljobs" });

router.get("/", async (ctx, _next) => {
  await tryRequest(ctx, async () => {
    const users = await getUserList(
      ctx.request.query.owner as string | undefined
    );
    const nodes = await getNodeList(
      ctx.request.query.node as string | undefined
    );
    ctx.body = await getJobSettings(users, nodes);
  });
});

export default router;

const CONFIG_FILE_NAME = "abaqusjob_config.json";
async function getJobSettings(users: string[], nodes: NodeObj[]) {
  const settings = [];
  for (const node of nodes) {
    const dirs = (
      await listUserFolders(node, CONFIG_FILE_NAME)
    ).directories.filter((_: any) => users.includes(_.owner));
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

      if (
        !(setting.config === null || Object.keys(setting.config).length === 0)
      ) {
        setting.error = `${CONFIG_FILE_NAME} exists. This may not be to use externally.`;
        settings.push(setting);
        continue;
      }

      settings.push(setting);
    }
  }
  return settings;
}
