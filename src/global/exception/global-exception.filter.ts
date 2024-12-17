import {
    ExceptionFilter,
    Catch,
    ArgumentsHost,
    HttpException,
    HttpStatus,
    Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionsFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionsFilter.name); 

    catch(exception: unknown, host: ArgumentsHost): void {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
        const message = status === HttpStatus.INTERNAL_SERVER_ERROR ? '서버에서 오류가 발생했습니다.' : (exception as HttpException).message;

        this.logger.error('🔥 [ERROR] 예외 발생');
        this.logger.error(`❌ [STATUS] ${status} - ${request.method} ${request.url}`);
        this.logger.error(`📘 [REQUEST BODY] ${JSON.stringify(request.body)}`);
        this.logger.error(`📘 [REQUEST PARAMS] ${JSON.stringify(request.params)}`);
        this.logger.error(`📘 [REQUEST QUERY] ${JSON.stringify(request.query)}`);

        if (exception instanceof Error) {
            this.logger.error(`❌ [ERROR MESSAGE] ${exception.message}`);
            this.logger.error(`📚 [STACK TRACE] ${exception.stack}`);
        }

        response.status(status).json({
            statusCode: status,
            message,
            timestamp: new Date().toISOString(),
            path: request.url,
        });
    }
}
