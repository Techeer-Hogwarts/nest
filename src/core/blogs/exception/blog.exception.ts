import { BaseException } from '../../../common/exception/base.exception';
import { ErrorCode } from '../../../common/exception/errorCode';

export class BlogNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.BLOG_NOT_FOUND);
    }
}
