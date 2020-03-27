import Router from 'koa-router';
import { tryRequest } from '../_helper.js';
import * as licensUtil from '~/utils/abaqus-licence.js';
import config from '~/utils/storedConfig.js';
import ConfigKey from '~/models/enums/config-key.js';

const router = new Router({ prefix: '/stats' });

router
  .get('/license', async(ctx, next) => {
    await tryRequest(ctx, async() => {
      ctx.body = {
        InUse: await licensUtil.getLicenceInUseByRunningJobs(),
        Capacity: parseInt(await config.get(ConfigKey.AvailableTokenCount))
      };
    });
  });

export default router;
