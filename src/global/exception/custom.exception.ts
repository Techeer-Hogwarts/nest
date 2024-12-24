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

export class AlreadyApprovedException extends HttpException {
    constructor() {
        super('이미 승인된 지원자는 변경할 수 없습니다.', HttpStatus.FORBIDDEN);
    }
}

export class NotApprovedFileExtension extends HttpException {
    constructor() {
        super('허용되지 않은 파일 형식입니다. ', HttpStatus.FORBIDDEN);
    }
}

export class DuplicateStudyTeamNameException extends HttpException {
    constructor() {
        super('이미 존재하는 스터디 이름입니다. ', HttpStatus.FORBIDDEN);
    }
}
