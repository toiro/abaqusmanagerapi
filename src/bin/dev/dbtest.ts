/* eslint-disable no-console */
import mongoose from 'mongoose'
import UserModel from 'app/store/model/user.js'
import AuthModel from 'app/store/model/auth.js'

async function test() {
  console.log('start')
  await mongoose.connect('mongodb://127.0.0.1:27017/abaqusmanagerdev')
  console.log('connected')
  const docs = await UserModel.find().exec()
  console.log(docs.map((_) => _.toObject()))
  const auth = await AuthModel.findOne({ key: '__AdminPass__' })
  console.log(auth?.toObject())
}

// eslint-disable-next-line no-void
void test()
