import JobModel from '../model/job.js';
import template from '../utils/crudTemplate.js';

const crud = template(JobModel, '_id');

export default crud;
