import { BaseException } from '../../../global/exception/common/base-exception';
import { ErrorCode } from '../../../global/exception/common/error-code';

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
