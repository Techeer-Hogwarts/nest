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

export class NotFoundBlogException extends HttpException {
    constructor() {
        super('블로그를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
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

export class NotFoundProjectException extends HttpException {
    constructor() {
        super('프로젝트 공고를 찾을 수 없습니다.', HttpStatus.NOT_FOUND);
    }
}

export class UploadProjectException extends HttpException {
    constructor() {
        super(
            '프로젝트 공고 업로드에 실패했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}

export class UpdateProjectException extends HttpException {
    constructor() {
        super(
            '프로젝트 공고 업데이트에 실패했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}

export class CloseProjectException extends HttpException {
    constructor() {
        super(
            '프로젝트 공고 마감에 실패했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}

export class DeleteProjectException extends HttpException {
    constructor() {
        super(
            '프로젝트 공고 삭제에 실패했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}

export class NotProjectMemberException extends HttpException {
    constructor() {
        super('해당 프로젝트의 멤버가 아닙니다.', HttpStatus.FORBIDDEN);
    }
}

export class DuplicateProjectNameException extends HttpException {
    constructor() {
        super('이미 존재하는 프로젝트 이름입니다.', HttpStatus.FORBIDDEN);
    }
}

export class AlreadyApprovedApplicantException extends HttpException {
    constructor() {
        super('이미 승인된 지원자는 변경할 수 없습니다.', HttpStatus.FORBIDDEN);
    }
}

export class NotApprovedFileExtensionException extends HttpException {
    constructor() {
        super('허용되지 않은 파일 형식입니다.', HttpStatus.FORBIDDEN);
    }
}

export class UploadProjectImageException extends HttpException {
    constructor() {
        super(
            '프로젝트 이미지 업로드에 실패했습니다.',
            HttpStatus.INTERNAL_SERVER_ERROR,
        );
    }
}

export class ForbiddenAccessException extends HttpException {
    constructor() {
        super('해당 게시물에 대한 권한이 없습니다.', HttpStatus.FORBIDDEN);
    }
}

export class DuplicateEmailException extends HttpException {
    constructor() {
        super('이미 가입한 이메일입니다. ', HttpStatus.FORBIDDEN);
    }
}

export class DuplicateStatusException extends HttpException {
    constructor() {
        super('상태가 동일합니다.', HttpStatus.CONFLICT);
    }
}

export class BadRequestCategoryException extends HttpException {
    constructor() {
        super('존재하지 않는 카테고리입니다.', HttpStatus.BAD_REQUEST);
    }
}

export class NotFoundExperienceException extends HttpException {
    constructor() {
        super(
            '경력을 생성한 사용자만 삭제할 수 있습니다.',
            HttpStatus.NOT_FOUND,
        );
    }
}

export class NoLeaderException extends HttpException {
    constructor() {
        super('최소 한 명의 리더가 있어야 합니다.', HttpStatus.BAD_REQUEST);
    }
}

export class NoPositionException extends HttpException {
    constructor() {
        super('모든 팀원은 포지션을 선택해야 합니다.', HttpStatus.BAD_REQUEST);
    }
}

export class NoRecruitmentSpaceException extends HttpException {
    constructor() {
        super(
            '모집 가능한 인원이 0명으로 더 이상 모집할 수 없습니다.',
            HttpStatus.BAD_REQUEST,
        );
    }
}

export class NotFoundApplicantException extends HttpException {
    constructor() {
        super(
            '모집 가능한 인원이 0명으로 더 이상 모집할 수 없습니다.',
            HttpStatus.BAD_REQUEST,
        );
    }
}
