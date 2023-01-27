import UserModel from '../../model/user.js';
import NodeModel from '../../model/node.js';
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
export async function getUserList(name) {
    const cond = name ? { name } : {};
    return (await UserModel.find(cond).exec()).map((doc) => doc.name);
}
export async function getNodeList(hostname) {
    const cond = hostname ? { hostname } : {};
    return (await NodeModel.find(cond).exec()).map((doc) => doc.toObject());
}
