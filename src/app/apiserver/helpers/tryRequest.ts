import type { ParameterizedContext } from 'koa';
import type { IRouterParamContext } from 'koa-router';

/**
 * エラー処理を共通化する
 * @param {ParameterizedContext<any, Router.IRouterParamContext<any, {}>>} ctx
 * @param {Function} toTry
 */
async function tryRequest(
  ctx: ParameterizedContext<any, IRouterParamContext<any, {}>, any>,
  toTry: () => Promise<void>
) {
  try {
    await toTry();
  } catch (e: unknown) {
    ctx.status = 500;
    ctx.body = e instanceof Error ? e.message : `Error ${typeof e} occured.`;
    ctx.app.emit('error', e, ctx);
  }
}

export default tryRequest;
