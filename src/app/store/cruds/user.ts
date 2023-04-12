import UserModel from '../model/user.js';
import template from '../utils/crudTemplate.js';

const crud = template(UserModel, 'name');

export default crud;
