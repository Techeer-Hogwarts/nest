import { BaseException } from '../../../common/exception/base.exception';
import { ErrorCode } from '../../../common/exception/errorCode';

export class StudyMemberNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_MEMBER_NOT_FOUND);
    }
}

export class StudyMemberIsActiveMemberException extends BaseException {
    constructor() {
        super(ErrorCode.STUDY_MEMBER_IS_ACTIVE_MEMBER);
    }
}
