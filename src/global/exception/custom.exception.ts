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

export class NotFoundUserException extends HttpException {
    constructor() {
        super('사용자를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
}

export class ForbiddenAccessException extends HttpException {
    constructor() {
        super('해당 게시물에 대한 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }
}
