import { ErrorCode } from '../../../common/exception/errorCode';
import { BaseException } from '../../../common/exception/base.exception';

export class ProjectTeamMissingUpdateMemberException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_MISSING_UPDATE_MEMBER);
    }
}

export class ProjectTeamNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_NOT_FOUND);
    }
}

export class ProjectTeamDuplicateTeamNameException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_DUPLICATE_TEAM_NAME);
    }
}

export class ProjectTeamInvalidTeamStackException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_INVALID_TEAM_STACK);
    }
}

export class ProjectTeamMissingLeaderException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_MISSING_LEADER);
    }
}

export class ProjectTeamInvalidRecruitNumException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_INVALID_RECRUIT_NUM);
    }
}

export class ProjectTeamMissingMainImageException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_MISSING_MAIN_IMAGE);
    }
}

export class ProjectTeamDuplicateDeleteUpdateException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_DUPLICATE_DELETE_UPDATE);
    }
}

export class ProjectTeamRecruitmentEndedException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_RECRUITMENT_ENDED);
    }
}

export class ProjectTeamInvalidTeamRoleException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_INVALID_TEAM_ROLE);
    }
}

export class ProjectTeamInvalidApplicantException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_INVALID_APPLICANT);
    }
}

export class ProjectTeamMainImageException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_MAIN_IMAGE_BAD_REQUEST);
    }
}

export class ProjectTeamExceededResultImageException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_EXCEEDED_RESULT_IMAGE);
    }
}

export class ProjectTeamAlreadyApprovedException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_TEAM_ALREADY_APPROVED);
    }
}
