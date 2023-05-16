import Router from 'koa-router'
import * as licenseUtil from 'app/junction/abaqus/abaqus-license.js'
import { useSettingReadOnly } from 'app/junction/Setting.js'
import MetaHandler from 'utils/MetaHandler.js'
import tryRequest from '../../utils/tryRequest.js'

const meta = new MetaHandler(import.meta)
const router = new Router({ prefix: `/${meta.ParsedPath.name}` })

router.get('/license', async (ctx, _next) => {
  await tryRequest(ctx, async () => {
    const [InUseDsls, InUse, settings] = await Promise.all([
      // dsls は取れない場合もエラーにはしない
      licenseUtil.getLicenseInUseByDslsstat().catch(() => NaN),
      licenseUtil.getLicenseInUseByRunningJobs(),
      useSettingReadOnly(),
    ])

    ctx.body = {
      InUseDsls,
      InUse,
      Capacity: settings.availableTokenCount,
    }
  })
})

export default router
