import winston from 'winston';
import config from 'config';

const timestampFormat = winston.format.timestamp({
  format: 'YYYY-MM-DD HH:mm:ss'
});

const combineFormat = winston.format.combine(
  timestampFormat,
  winston.format.json()
);

const errorFormat = winston.format.combine(
  timestampFormat,
  winston.format.errors({ stack: true }),
  winston.format.simple()
);

const consoleFormat = winston.format.combine(
  timestampFormat,
  winston.format.errors({ stack: true }),
  winston.format.simple()
);

const logger = winston.createLogger({
  level: 'debug',
  format: combineFormat,
  transports: [
    // 全体ログ
    new winston.transports.File({ filename: 'combined.log' }),
    // エラーログ
    new winston.transports.File({
      filename: 'error.log',
      level: 'error',
      format: errorFormat
    })
  ]
});

if (config.env !== 'production') {
  // コンソールログ出力
  logger.add(new winston.transports.Console({
    format: consoleFormat
  }));
}

export default logger;

/**
 * コンソール出力以外のログを止める
 * デバッグ用
 */
export const consoleOnly = () => {
  logger.remove(
    logger.transports.find(t => !(t instanceof winston.transports.Console))
  );
};
