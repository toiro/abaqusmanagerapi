import template from './_template.js';
import ConfigModel from '~/models/config.js';

const crud = template(ConfigModel, 'key');

export default crud;
