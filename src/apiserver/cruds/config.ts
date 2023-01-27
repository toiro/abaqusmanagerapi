import ConfigModel from 'model/config.js';
import template from './_template.js';

const crud = template(ConfigModel, 'key');

export default crud;
