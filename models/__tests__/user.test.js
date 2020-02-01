import mongoose from 'mongoose';
import { consoleOnly } from '~/utils/logger.js';
import connectDb from '~/utils/connectdb.js';
import target, { UserModel } from '../user.js';

const db = mongoose.connection;

beforeAll(async() => {
  consoleOnly();
  await connectDb();
  try {
    await db.dropCollection('users');
  } catch {}
});

afterAll(async() => {
  await db.close();
});

const testname = 'ando';
test('create a new user on db', async() => {
  await target.addItem(testname);
  const newUser = await UserModel.findOne({ name: testname });

  expect(newUser.name).toEqual(testname);
});

test('find a user by name from db', async() => {
  const user = await target.getItem(testname);
  expect(user.name).toEqual(testname);
});

const testname2 = 'inoue';
test('get userlist from db', async() => {
  await target.addItem(testname2);
  const users = await target.getItems();
  expect(users.length).toBe(2);
  expect(users[0].name).toEqual(testname);
  expect(users[1].name).toEqual(testname2);
});

test('delete an user on db', async() => {
  const deleted = await target.deleteItem(testname);
  expect(deleted.name).toEqual(testname);
  const none = await target.getItem(testname);
  expect(none).toBeNull();
});

test('delete a not-exists user on db', async() => {
  const deleted = await target.deleteItem(testname);
  expect(deleted).toBeNull();
});
