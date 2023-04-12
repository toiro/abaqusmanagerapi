import type JobCommand from './JobCommand';

type JobConfig = {
  name?: string;
  description?: string;
  command: JobCommand;
};
export default JobConfig;
