import { BaseException } from '../../../common/exception/base.exception';
import { ErrorCode } from '../../../common/exception/errorCode';

export class ResumeNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.RESUME_NOT_FOUND);
    }
}