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

export class NotFoundResumeException extends HttpException {
    constructor() {
        super('이력서를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
}

export class ForbiddenException extends HttpException {
    constructor() {
        super(
            '해당 리소스에 대한 수정 또는 삭제 권한이 없습니다.',
            HttpStatus.FORBIDDEN,
        );
    }
}
