import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Request, Response } from 'express';
import { BaseException, ServerException } from './base.exception';
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
        } else {
            err = new ServerException();
            if (exception instanceof Error) {
                this.logger.bodyError(exception, err, request);
            }
        }
        const res = new ExceptionResponse(err, request.url);
        response.status(res.getStatusCode()).json(res.toJson());
    }
}
