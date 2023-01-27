import NodeModel from 'model/node.js';
import template from './_template.js';

const crud = template(NodeModel, 'hostname');

export default crud;
