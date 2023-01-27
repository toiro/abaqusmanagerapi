import JobModel from 'model/job.js';
import template from './_template.js';

const crud = template(JobModel, '_id');

export default crud;
