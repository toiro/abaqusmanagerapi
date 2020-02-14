import template from './_template.js';
import JobModel from '~/models/job.js';

const crud = template(JobModel, '_id');

export default crud;
