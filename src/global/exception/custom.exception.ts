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
        super('사용자가 존재하지 않습니다.', HttpStatus.NOT_FOUND);
    }
}

export class UploadStudyTeamException extends HttpException {
    constructor() {
        super('스터디 공고 업로드에 실패했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}  

export class UpdateStudyTeamException extends HttpException {
    constructor() {
        super('스터디 공고 업데이트에 실패했습니다.', HttpStatus.INTERNAL_SERVER_ERROR);
    }
}

export class NotFoundStudyTeamException extends HttpException {
    constructor() {
        super('스터디 공고를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
}

export class NotStudyMemberException extends HttpException {
    constructor() {
        super('해당 스터디의 멤버가 아닙니다.', HttpStatus.FORBIDDEN);
    }
}