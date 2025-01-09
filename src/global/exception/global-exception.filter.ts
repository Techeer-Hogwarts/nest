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

        // 상태 코드 설정
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // 예외 메시지 및 스택 트레이스 추출
        let message: string;
        let stack: string | undefined;

        if (exception instanceof HttpException) {
            message = exception.message || exception.getResponse()?.toString();
            stack = exception.stack;
        } else if (exception instanceof Error) {
            message = exception.message;
            stack = exception.stack;
        } else {
            message = '알 수 없는 오류가 발생했습니다.';
            stack = undefined;
        }

        // 클라이언트로 반환할 JSON 데이터
        const errorResponse = {
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message,
        };

        // 서버 로그 출력
        this.logger.error(
            `Error Occurred:
            Request Path: ${request.url}
            Request Method: ${request.method}
            Status Code: ${status}
            Message: ${message}
            Stack: ${stack || '스택 정보 없음'}`,
        );

        // 클라이언트에 응답
        response.status(status).json(errorResponse);
    }
}
