import { BaseException } from './base.exception';

interface ExceptionResponseDto {
    errorCode: string;
    statusCode: number;
    path: string;
    message: string;
    timestamp: string;
}

export class ExceptionResponse {
    private readonly errorCode: string;
    private readonly statusCode: number;
    private readonly errorMessage: string;
    private readonly requestUrl: string;
    private readonly date: string;
    constructor(exception: BaseException, requestUrl: string) {
        this.errorCode = exception.code;
        this.statusCode = exception.statusCode;
        this.errorMessage = exception.message;
        this.requestUrl = requestUrl;
        this.date = new Date().toISOString();
    }

    getStatusCode(): number {
        return this.statusCode;
    }

    toJson(): ExceptionResponseDto {
        return {
            errorCode: this.errorCode,
            statusCode: this.statusCode,
            path: this.requestUrl,
            message: this.errorMessage,
            timestamp: this.date,
        };
    }
}
