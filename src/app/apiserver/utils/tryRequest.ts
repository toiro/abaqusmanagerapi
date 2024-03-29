import type { ParameterizedContext } from 'koa';
import type { IRouterParamContext } from 'koa-router';

/**
 * エラー処理を共通化する
 * @param {ParameterizedContext<any, Router.IRouterParamContext<any, {}>>} ctx
 * @param {Function} toTry
 */
async function tryRequest<T>(
  ctx: ParameterizedContext<any, IRouterParamContext<any, T>, any>,
  toTry: () => Promise<void> | void
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
