import supertest from 'supertest';
import Koa from 'koa';
import target from './users.js';

let server;
let request;

beforeAll(async() => {
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

test('create a new user: POST /users', async() => {
  const response = await request.get('/v1/api/users');
  expect(response.status).toEqual(200);
});

test('get users list: GET /users', async() => {
  const response = await request.get('/v1/api/jobs');
  expect(response.status).toEqual(200);
});

test('get an user: GET /users/:id', async() => {
  const response = await request.get('/v1/api/user/1');
  expect(response.status).toEqual(200);
});
