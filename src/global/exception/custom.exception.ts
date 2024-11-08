import { HttpException, HttpStatus } from '@nestjs/common';

export class NotFoundSessionException extends HttpException {
    constructor() {
        super('세션 게시물을 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
}

export class NotFoundEventException extends HttpException {
    constructor() {
        super('이벤트를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
}
