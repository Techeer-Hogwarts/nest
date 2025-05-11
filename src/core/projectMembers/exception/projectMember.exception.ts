import { BaseException } from '../../../common/exception/base.exception';
import { ErrorCode } from '../../../common/exception/errorCode';

export class ProjectMemberInvalidTeamRoleException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_MEMBER_INVALID_TEAM_ROLE);
    }
}

export class ProjectMemberInvalidActiveRequesterException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_MEMBER_INVALID_ACTIVE_REQUESTER);
    }
}

export class ProjectMemberApplicationExistsException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_MEMBER_APPLICATION_EXISTS);
    }
}

export class ProjectMemberAlreadyActiveException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_MEMBER_ALREADY_ACTIVE);
    }
}
export class ProjectMemberNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.PROJECT_MEMBER_NOT_FOUND);
    }
}
