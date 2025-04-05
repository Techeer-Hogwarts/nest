import { BaseException } from '../../../common/exception/base.exception';
import { ErrorCode } from '../../../common/exception/errorCode';

export class UserExperienceInvalidPositionException extends BaseException {
    constructor() {
        super(ErrorCode.USER_EXPERIENCE_INVALID_POSITION);
    }
}

export class UserExperienceInvalidCategoryException extends BaseException {
    constructor() {
        super(ErrorCode.USER_EXPERIENCE_INVALID_CATEGORY);
    }
}

export class UserExperienceNotFoundExperienceException extends BaseException {
    constructor() {
        super(ErrorCode.USER_EXPERIENCE_NOT_FOUND);
    }
}
