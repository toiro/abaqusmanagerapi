import fs from 'fs';
import path from 'path';
import scriptDir from '../utils/scriptdir.js';
import { logger } from '../utils/logger.js';
const selfDir = scriptDir(import.meta);
export default async (dirPath) => {
    const modules = await Promise.all((await fs.promises.readdir(dirPath, { withFileTypes: true }))
        .filter(dirent => dirent.isFile())
        .map(async (dirent) => {
        // パス区切り文字が \ だと URL として不正
        const modulePath = path.join(path.relative(selfDir, dirPath), dirent.name).replace('\\', '/');
        try {
            logger.verbose(`Import dinamically from ${modulePath}`);
            return await import(modulePath);
        }
        catch (error) {
            logger.error(`Failed to import dinamically from ${modulePath}. `, error);
            return undefined;
        }
    }));
    return modules;
};
