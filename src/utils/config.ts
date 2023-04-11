import config from "config";
import type { IConfig } from "config";

interface AppConfig extends IConfig {
  env: string,
  host: string,
  port: number,
  mongo: {
    host: string,
    db: string
  }
  log: {
    directory: string
  }
}

export default config as AppConfig