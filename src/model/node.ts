export const name = 'Node';

export interface INode {
  hostname: string;
  maxConcurrentJob: number;
  executeDirectoryRoot: string;
  resultDirectoryRoot: string;
  importDirectoryRoot: string;
  winrmCredential: {
    user: string;
    encryptedPassword: string;
  };
}
