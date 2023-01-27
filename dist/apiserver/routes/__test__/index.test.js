import supertest from 'supertest';
import Koa from 'koa';
import target from '../index.js';
jest.mock('~/apiserver/cruds/user.js');
jest.mock('~/apiserver/cruds/job.js');
let server;
let request;
beforeAll(async () => {
    const app = new Koa();
    app
        .use(target.routes())
        .use(target.allowedMethods());
    server = app.listen();
    request = supertest(server);
});
afterAll(() => {
    server.close();
});
test('route to GET /v1/api/users', async () => {
    const response = await request.get('/v1/api/users');
    expect(response.status).toBe(200);
});
test('route to GET /v1/api/jobs', async () => {
    const response = await request.get('/v1/api/jobs');
    expect(response.status).toBe(200);
});
test('route to path not exists return 404', async () => {
    const response = await request.get('/v1/api/not-exists');
    expect(response.status).toBe(404);
});
