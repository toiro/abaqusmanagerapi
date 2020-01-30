import winston from 'winston';
import config from 'config';

const timestampFormat = 'YYYY-MM-DD HH:mm:ss';

const combineFormat = winston.format.combine(
  winston.format.timestamp({
    format: timestampFormat
  }),
  winston.format.json()
);

const errorFormat = winston.format.combine(
  winston.format.timestamp({
    format: timestampFormat
  }),
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
  const debugFormat = winston.format.combine(
    winston.format.timestamp({
      format: timestampFormat
    }),
    winston.format.errors({ stack: true }),
    winston.format.simple()
  );
  logger.add(new winston.transports.Console({
    format: debugFormat
  }));
}

export default logger;
