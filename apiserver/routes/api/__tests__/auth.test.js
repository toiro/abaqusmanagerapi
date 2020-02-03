import supertest from 'supertest';
import Koa from 'koa';
import target from '../auth.js';

jest.mock('~/models/config.js');

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

test('try with valid password: POST /auth', async() => {
  const response = await request
    .post('/auth')
    .send({ name: 'admin', pass: 'pass' });
  expect(response.status).toBe(200);
  expect(response.body).toBe(true);
});

test('try with invalid password: POST /auth', async() => {
  const response = await request
    .post('/auth')
    .send({ name: 'admin', pass: 'missing' });
  expect(response.status).toBe(200);
  expect(response.body).toBe(false);
});
