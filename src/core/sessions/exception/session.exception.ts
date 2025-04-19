import { ErrorCode } from '../../../common/exception/errorCode';
import { BaseException } from '../../../common/exception/base.exception';

export class SessionNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.SESSION_NOT_FOUND);
    }
}

export class SessionForbiddenException extends BaseException {
    constructor() {
        super(ErrorCode.SESSION_FORBIDDEN);
    }
}
