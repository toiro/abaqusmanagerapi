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
test.only('create a new user on db', async() => {
  await target.addEntry(target.identifier(testname));
  const newUser = await UserModel.findOne(target.identifier(testname)).exec();
  expect(newUser).not.toBeNull();
  expect(newUser.name).toEqual(testname);
});

test('find a user by name from db', async() => {
  const user = await target.getEntry(target.identifier(testname));
  expect(user.name).toEqual(testname);
});

const testname2 = 'inoue';
test('get userlist from db', async() => {
  await target.addEntry(target.identifier(testname2));
  const users = await target.getEntrys();
  expect(users.length).toBe(2);
  expect(users[0].name).toEqual(testname);
  expect(users[1].name).toEqual(testname2);
});

test('delete an user on db', async() => {
  const deleted = await target.deleteEntry(target.identifier(testname));
  expect(deleted.name).toEqual(testname);
  const none = await target.getEntry(target.identifier(testname));
  expect(none).toBeNull();
});

test('delete a not-exists user on db', async() => {
  const deleted = await target.deleteEntry(target.identifier(testname));
  expect(deleted).toBeNull();
});
