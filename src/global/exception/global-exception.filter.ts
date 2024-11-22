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
    catch(exception: unknown, host: ArgumentsHost): void {
        // 반환 타입을 void로 명시
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        // 기본 상태코드가 없는 경우, Internal Server Error로 처리
        const status =
            exception instanceof HttpException
                ? exception.getStatus()
                : HttpStatus.INTERNAL_SERVER_ERROR;

        // 기본 메시지를 커스텀 메시지로 설정
        const message =
            status === HttpStatus.INTERNAL_SERVER_ERROR
                ? '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
                : (exception as HttpException).message ||
                  '알 수 없는 오류가 발생했습니다.';

        // 응답 형식 설정
        response.status(status).json({
            statusCode: status,
            timestamp: new Date().toISOString(),
            path: request.url,
            message,
        });

        // 서버 로그 출력
        const logger: Logger = new Logger('GlobalExceptionsFilter');
        logger.error(exception);
    }
}
