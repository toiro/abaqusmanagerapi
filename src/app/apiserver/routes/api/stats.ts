import Router from 'koa-router';
import * as licenseUtil from 'app/junction/abaqus/abaqus-licence.js';
import config from 'app/junction/storedConfig.js';
import { ConfigKey } from 'model/resources/enums.js';
import { tryRequest } from '../_helper.js';

const router = new Router({ prefix: '/stats' });

router.get('/license', async (ctx, _next) => {
  await tryRequest(ctx, async () => {
    ctx.body = {
      // dsls は取れない場合もエラーにはしない
      InUseDsls: await licenseUtil.getLicenceInUseByDslsstat().catch(() => NaN),
      InUse: await licenseUtil.getLicenceInUseByRunningJobs(),
      Capacity: parseInt(await config.get(ConfigKey.AvailableTokenCount), 10),
    };
  });
});

export default router;
