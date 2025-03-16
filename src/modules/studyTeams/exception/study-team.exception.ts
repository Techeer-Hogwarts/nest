import { ErrorCode } from '../../../global/exception/common/error-code';
import { BaseException } from '../../../global/exception/common/base-exception';

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
