import supertest from 'supertest';
import Koa from 'koa';
import target from '../users.js';

jest.mock('~/models/user.js');

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
  const response = await request.get('/users');
  expect(response.status).toBe(200);
});

test('get users list: GET /users', async() => {
  const response = await request.get('/users');
  expect(response.status).toBe(200);
});

test('get an user: GET /users/:id', async() => {
  const response = await request.get('/users/ando');
  expect(response.status).toBe(200);
});

test('get a not-exists user: GET /users/:id', async() => {
  const response = await request.get('/users/inoue');
  expect(response.status).toBe(204);
});

test('delete an user: DELETE /users/:id', async() => {
  const response = await request.delete('/users/ando');
  expect(response.status).toBe(200);
});

test('delete a not-exists user: DELETE /users/:id', async() => {
  const response = await request.delete('/users/inoue');
  expect(response.status).toBe(204);
});
