import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException } from './base.exception';
import { ExceptionResponse } from './exception.response';
import { CustomWinstonLogger } from '../logger/winston.logger';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
    constructor(private readonly logger: CustomWinstonLogger) {}

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        let err: BaseException;

        if (exception instanceof BaseException) {
            err = exception;
            this.logger.bodyError(exception, err, request);
            const res = new ExceptionResponse(err, request.url);
            response.status(res.getStatusCode()).json(res.toJson());
            // } else {
            //     err = new ServerException();
            //     if (exception instanceof Error) {
            //         this.logger.bodyError(exception, err, request);
            //     }
            // }
        } else {
            const status =
                exception instanceof HttpException
                    ? exception.getStatus()
                    : HttpStatus.INTERNAL_SERVER_ERROR;

            let message: string | string[] = '알 수 없는 오류가 발생했습니다.';

            if (exception instanceof HttpException) {
                const exceptionResponse = exception.getResponse();
                // 메시지가 문자열 또는 객체인 경우 처리
                if (typeof exceptionResponse === 'string') {
                    message = exceptionResponse;
                } else if (
                    typeof exceptionResponse === 'object' &&
                    exceptionResponse.hasOwnProperty('message')
                ) {
                    message = (exceptionResponse as any).message;
                }

                // 간소화된 로그 출력
                this.logger.error(
                    `[${request.method}] ${request.url} - ${exception.constructor.name}: ${
                        Array.isArray(message) ? message.join(', ') : message
                    } (status: ${status})`,
                );
            } else if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
                message =
                    '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
                this.logger.error(exception);
            }

            // 응답 형식 설정
            response.status(status).json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                message,
            });
        }
    }
}
