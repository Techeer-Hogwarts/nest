import { HttpException } from '@nestjs/common';
import { ErrorCode } from './errorCode';

export class BaseException extends HttpException {
    readonly code: string;
    readonly statusCode: number;
    readonly message: string;
    readonly customMessage?: string

    constructor(error: { code: string; status: number; message: string }, customMessage?: string) {
        super(error.code, error.status);
        this.code = error.code;
        this.statusCode = error.status;
        this.message = error.message;
        this.customMessage = customMessage;
    }
}

export class ServerException extends BaseException {
    readonly customMessage?: string;

    constructor(message?: string) {
        super(ErrorCode.INTERNAL_SERVER_ERROR);
        this.customMessage = message;
    }
}
