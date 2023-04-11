import type { ConfigKey } from './resources/enums.js';

export const name = 'Config';

export interface IConfig {
  key: ConfigKey;
  value: string;
}
