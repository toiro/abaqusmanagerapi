import template from './_template.js';
import NodeModel from '~/models/node.js';

const crud = template(NodeModel, 'hostname');

export default crud;
