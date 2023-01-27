import winston from 'winston';
import path from 'path';
import config from './config.js';
const logDir = config.log ? config.log.directory : '.';
const timestampFormat = winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
});
const combineFormat = winston.format.combine(timestampFormat, winston.format.json());
const errorFormat = winston.format.combine(timestampFormat, winston.format.errors({ stack: true }), winston.format.simple());
const consoleFormat = winston.format.combine(timestampFormat, winston.format.errors({ stack: true }), winston.format.simple());
export const logger = winston.createLogger({
    level: 'debug',
    format: combineFormat,
    transports: [
        // 全体ログ
        new winston.transports.File({ filename: path.join(logDir, 'combined.log') }),
        // エラーログ
        new winston.transports.File({
            filename: path.join(logDir, 'error.log'),
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
/**
 * コンソール出力以外のログを止める
 * デバッグ用
 */
export const consoleOnly = () => {
    const target = logger.transports.find(t => !(t instanceof winston.transports.Console));
    if (target)
        logger.remove(target);
};
