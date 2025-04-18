import { BaseException } from '../../../common/exception/base.exception';
import { ErrorCode } from '../../../common/exception/errorCode';

export class AuthNotVerifiedEmailException extends BaseException {
    constructor() {
        super(ErrorCode.AUTH_NOT_VERIFIED_EMAIL);
    }
}

export class AuthInvalidCodeException extends BaseException {
    constructor() {
        super(ErrorCode.AUTH_INVALID_CODE);
    }
}

export class AuthVerificationFailedException extends BaseException {
    constructor() {
        super(ErrorCode.AUTH_VERIFICATION_FAILED);
    }
}

export class AuthNotFoundUserException extends BaseException {
    constructor() {
        super(ErrorCode.AUTH_NOT_FOUND_USER);
    }
}

export class AuthInvalidPasswordException extends BaseException {
    constructor() {
        super(ErrorCode.AUTH_INVALID_PASSWORD);
    }
}

export class AuthProfileImageNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.AUTH_PROFILE_IMAGE_NOT_FOUND);
    }
}

export class AuthNotTecheerException extends BaseException {
    constructor() {
        super(ErrorCode.AUTH_NOT_TECHEER);
    }
}

export class AuthUnauthorizedException extends BaseException {
    constructor() {
        super(ErrorCode.AUTH_UNAUTHORIZED);
    }
}
