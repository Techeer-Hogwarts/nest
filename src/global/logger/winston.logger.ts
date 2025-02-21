import { Injectable, LoggerService, LogLevel } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class CustomWinstonLogger implements LoggerService {
    private readonly winstonLogger: winston.Logger;

    constructor() {
        this.winstonLogger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                    level:
                        process.env.LOGGER_LEVEL === 'production'
                            ? 'info'
                            : 'debug',
                    format: winston.format.combine(
                        winston.format.timestamp({
                            format: 'YYYY-MM-DD HH:mm:ss',
                        }),
                        winston.format.printf(
                            ({ level, message, timestamp, context }) => {
                                const color = this.getLogLevelColor(level); // 동일한 색상 가져오기
                                const coloredText = (text: string): string =>
                                    `\x1b[${color}m${text}\x1b[0m`; // 색상 적용

                                return `${coloredText(String(timestamp))} [${coloredText(level)}]${
                                    context
                                        ? ` [${coloredText(String(context))}]`
                                        : ''
                                }: ${coloredText(String(message))}`;
                            },
                        ),
                    ),
                }),
                new winston.transports.File({
                    filename: 'application.log',
                    level: 'info',
                    format: winston.format.combine(
                        winston.format.timestamp({
                            format: 'YYYY-MM-DD HH:mm:ss',
                        }),
                        winston.format.json(),
                    ),
                }),
            ],
        });
    }

    private getLogLevelColor(level: string): string {
        // 로그 레벨별로 다른 색상 반환
        switch (level) {
            case 'info':
                return '36'; // Cyan
            case 'error':
                return '31'; // Red
            case 'warn':
                return '33'; // Yellow
            case 'debug':
                return '34'; // Blue
            case 'verbose':
                return '32'; // Green
            default:
                return '37'; // White
        }
    }

    log(message: any, ...optionalParams: any[]): void {
        this.winstonLogger.info(message, { context: optionalParams[0] });
    }

    error(message: any, ...optionalParams: any[]): void {
        const trace = optionalParams[0];
        const context = optionalParams[1];
        this.winstonLogger.error(message, {
            trace,
            context,
        });
    }

    warn(message: any, ...optionalParams: any[]): void {
        this.winstonLogger.warn(message, { context: optionalParams[0] });
    }

    debug?(message: any, ...optionalParams: any[]): void {
        this.winstonLogger.debug(message, { context: optionalParams[0] });
    }

    verbose?(message: any, ...optionalParams: any[]): void {
        this.winstonLogger.verbose(message, { context: optionalParams[0] });
    }

    fatal?(message: any, ...optionalParams: any[]): void {
        const context = optionalParams[0];
        this.winstonLogger.log({
            level: 'fatal',
            message,
            context,
        });
    }

    setLogLevels?(levels: LogLevel[]): void {
        const winstonLevels = levels.map((level) => {
            switch (level) {
                case 'log':
                    return 'info';
                case 'error':
                case 'warn':
                case 'debug':
                case 'verbose':
                case 'fatal':
                    return level;
                default:
                    return 'info';
            }
        });

        this.winstonLogger.configure({
            level: winstonLevels[0],
        });
    }
}
