import ConfigModel from '../model/auth.js';
import template from '../utils/crudTemplate.js';

const crud = template(ConfigModel, 'key');

export default crud;
