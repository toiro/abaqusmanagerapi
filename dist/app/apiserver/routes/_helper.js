/**
 * エラー処理を共通化する
 * @param {ParameterizedContext<any, Router.IRouterParamContext<any, {}>>} ctx
 * @param {Function} toTry
 */
export async function tryRequest(ctx, toTry) {
    try {
        await toTry();
    }
    catch (e) {
        ctx.status = 500;
        ctx.body = e instanceof Error ? e.message : `Error ${typeof e} occured.`;
        ctx.app.emit('error', e, ctx);
    }
}
