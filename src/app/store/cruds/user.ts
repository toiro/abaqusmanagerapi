import UserModel from '../model/user.js';
import template from './_template.js';

const crud = template(UserModel, 'name');

export default crud;
