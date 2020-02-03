import mongoose from 'mongoose';
import template from './_crud-template.js';
import schema from './schemas/user.js';

export const UserModel = mongoose.model('User', schema);

const crud = template(UserModel, 'name');

export default crud;
