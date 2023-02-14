type JobCommand = { [key: string]: string | number };

export type JobConfig = {
  name?: string;
  description?: string;
  command: JobCommand;
};

export type DirectoryInfoBody = {
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
