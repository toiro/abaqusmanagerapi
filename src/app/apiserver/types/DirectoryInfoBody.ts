import type JobCommand from './JobCommand';

type DirectoryInfoBody = {
  name: string;
  owner: string;
  node: string;
  config: string;
  inputfiles: string[];
  command: JobCommand;
  input: {
    sharedDirectory?: {
      path: string;
    };
    external?: {
      workingDir: string;
    };
  };
  description: string;
  error: string;
};
export default DirectoryInfoBody;
