import ConfigModel from '../model/config.js';
import template from '../utils/crudTemplate.js';

const crud = template(ConfigModel, 'key');

export default crud;
