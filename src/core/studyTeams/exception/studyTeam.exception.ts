import { ErrorCode } from '../../../common/exception/errorCode';
import { BaseException } from '../../../common/exception/base.exception';

export class StudyTeamBadRequestException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_INVALID_RECRUIT_NUM);
    }
}

export class StudyTeamNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_NOT_FOUND);
    }
}

export class StudyTeamDuplicateTeamNameException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_DUPLICATE_TEAM_NAME);
    }
}

export class StudyTeamDuplicateDeleteUpdateException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_DUPLICATE_DELETE_UPDATE);
    }
}

export class StudyTeamMissingLeaderException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_MISSING_LEADER);
    }
}

export class StudyTeamInvalidRecruitNumException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_INVALID_RECRUIT_NUM);
    }
}

export class StudyTeamInvalidUpdateMemberException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_INVALID_UPDATE_MEMBER);
    }
}

export class StudyTeamInvalidUserException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_INVALID_USER);
    }
}

export class StudyTeamAlreadyActiveMemberException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_ALREADY_ACTIVE_MEMBER);
    }
}

export class StudyTeamInvalidApplicantException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_INVALID_APPLICANT);
    }
}
export class StudyTeamAlreadyRejectMemberException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_ALREADY_REJECT_MEMBER);
    }
}

export class StudyTeamNotActiveMemberException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_TEAM_NOT_ACTIVE_MEMBER);
    }
}
