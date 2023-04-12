import NodeModel from '../model/node.js';
import template from '../utils/crudTemplate.js';

const crud = template(NodeModel, 'hostname');

export default crud;
