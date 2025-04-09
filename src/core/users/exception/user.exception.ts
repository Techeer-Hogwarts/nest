import { BaseException } from '../../../common/exception/base.exception';
import { ErrorCode } from '../../../common/exception/errorCode';

export class UserNotVerifiedEmailException extends BaseException {
    constructor() {
        super(ErrorCode.USER_NOT_VERIFIED_EMAIL);
    }
}

export class UserNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.USER_NOT_FOUND);
    }
}

export class UserNotFoundTecheerException extends BaseException {
    constructor() {
        super(ErrorCode.USER_NOT_TECHEER);
    }
}

export class UserNotFoundResumeException extends BaseException {
    constructor() {
        super(ErrorCode.USER_NOT_FOUND_RESUME);
    }
}

export class UserAlreadyExistsException extends BaseException {
    constructor() {
        super(ErrorCode.USER_ALREADY_EXISTS);
    }
}

export class UserUnauthorizedAdminException extends BaseException {
    constructor() {
        super(ErrorCode.USER_UNAUTHORIZED_ADMIN);
    }
}

export class UserNotFoundProfileImgException extends BaseException {
    constructor() {
        super(ErrorCode.USER_PROFILE_IMG_FAIL);
    }
}
