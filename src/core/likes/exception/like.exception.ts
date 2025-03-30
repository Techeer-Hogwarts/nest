import { ErrorCode } from '../../../common/exception/errorCode';
import { BaseException } from '../../../common/exception/base.exception';

export class LikeInvalidCategoryException extends BaseException {
    constructor() {
        super(ErrorCode.LIKE_INVALID_CATEGORY);
    }
}

export class LikeDuplicateRequestException extends BaseException {
    constructor() {
        super(ErrorCode.LIKE_DUPLICATE_REQUEST);
    }
}

export class LikeContentNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.LIKE_CONTENT_NOT_FOUND);
    }
}
