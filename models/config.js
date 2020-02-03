import mongoose from 'mongoose';
import template from './_crud-template.js';
import schema from './schemas/config.js';

export const ConfigModel = mongoose.model('Config', schema);

const crud = template(ConfigModel, 'key');

export default crud;
