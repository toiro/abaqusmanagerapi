import path from 'path';

export default (importmeta: ImportMeta) => {
  const dirname = path.dirname(new URL(importmeta.url).pathname);
  return process.platform === 'win32' ? dirname.substring(1) : dirname;
};
