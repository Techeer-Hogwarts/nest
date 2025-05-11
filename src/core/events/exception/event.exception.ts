import { BaseException } from '../../../common/exception/base.exception';
import { ErrorCode } from '../../../common/exception/errorCode';

export class EventNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.EVENT_NOT_FOUND);
    }
}

export class EventForbiddenException extends BaseException {
    constructor() {
        super(ErrorCode.EVENT_FORBIDDEN);
    }
}
