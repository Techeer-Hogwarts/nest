import { HttpException } from '@nestjs/common';

import { ErrorCode } from './errorCode';

export class BaseException extends HttpException {
    readonly code: string;
    readonly statusCode: number;
    readonly message: string;

    constructor(error: { code: string; status: number; message: string }) {
        super(error.code, error.status);
        this.code = error.code;
        this.statusCode = error.status;
        this.message = error.message;
    }
}

export class ServerException extends BaseException {
    constructor() {
        super(ErrorCode.INTERNAL_SERVER_ERROR);
    }
}
