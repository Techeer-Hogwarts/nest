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

export class LikeInvalidUserIdException extends BaseException {
    constructor() {
        super(ErrorCode.LIKE_INVALID_USER_ID);
    }
}

export class LikeInvalidContentIdException extends BaseException {
    constructor() {
        super(ErrorCode.LIKE_INVALID_CONTENT_ID);
    }
}

export class LikeDatabaseOperationException extends BaseException {
    constructor() {
        super(ErrorCode.LIKE_DATABASE_OPERATION_FAILED);
    }
}

export class LikeTransactionFailedException extends BaseException {
    constructor() {
        super(ErrorCode.LIKE_TRANSACTION_FAILED);
    }
}

export class LikeInvalidTableConfigurationException extends BaseException {
    constructor() {
        super(ErrorCode.LIKE_INVALID_TABLE_CONFIGURATION);
    }
}
