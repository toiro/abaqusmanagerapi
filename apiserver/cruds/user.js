import template from './_template.js';
import UserModel from '~/models/user.js';

const crud = template(UserModel, 'name');

export default crud;
