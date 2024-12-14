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

export class NotVerifiedEmailException extends HttpException {
    constructor() {
        super('이메일 인증이 필요합니다.', HttpStatus.UNAUTHORIZED);
    }
}

export class InvalidException extends HttpException {
    constructor() {
        super(
            '비밀번호나 아이디가 일치하지 않습니다.',
            HttpStatus.UNAUTHORIZED,
        );
    }
}

export class InvalidTokenException extends HttpException {
    constructor() {
        super('유효하지 않은 토큰입니다.', HttpStatus.UNAUTHORIZED);
    }
}

export class InternalServerErrorException extends HttpException {
    constructor() {
        super(
            '서버에서 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}

export class InvalidCodeException extends HttpException {
    constructor() {
        super('인증 코드가 일치하지 않습니다.', HttpStatus.UNAUTHORIZED);
    }
}

export class NotFoundCodeException extends HttpException {
    constructor() {
        super('인증 코드가 존재하지 않습니다.', HttpStatus.NOT_FOUND);
    }
}

export class UnauthorizedEmailException extends HttpException {
    constructor() {
        super(
            '이메일이 인증 상태 저장 중 문제가 발생했습니다.',
            HttpStatus.UNAUTHORIZED,
        );
    }
}

export class EmailVerificationFailedException extends HttpException {
    constructor() {
        super('이메일 인증에 실패하였습니다.', HttpStatus.UNAUTHORIZED);
    }
}

export class NotFoundTecheerException extends HttpException {
    constructor() {
        super(
            '회원가입이 불가능한 사용자입니다. 테커 소속만 가입이 가능합니다.',
            HttpStatus.UNAUTHORIZED,
        );
    }
}

export class UnauthorizedAdminException extends HttpException {
    constructor() {
        super(
            '권한이 없습니다. 관리자만 승인할 수 있습니다.',
            HttpStatus.UNAUTHORIZED,
        );
    }
}

export class NotFoundProfileImageException extends HttpException {
    constructor() {
        super('프로필 이미지를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
}

export class BadRequestException extends HttpException {
    constructor() {
        super(
            'isIntern이나 IsFulltime false일 때 인턴 관련 필드를 입력할 수 없습니다.',
            HttpStatus.BAD_REQUEST,
        );
    }
}
