import { BaseException } from "../../../common/exception/base.exception";
import { ErrorCode } from "../../../common/exception/errorCode";

export class BookmarkContentNotFoundException extends BaseException {
    constructor() {
        super(ErrorCode.BOOKMARK_CONTENT_NOT_FOUND);
    }
}

export class BookmarkInvalidCategoryException extends BaseException {
    constructor() {
        super(ErrorCode.BOOKMARK_INVALID_CATEGORY);
    }
}

export class BookmarkTransactionFailedException extends BaseException {
    constructor() {
        super(ErrorCode.BOOKMARK_TRANSACTION_FAILED);
    }
}

export class BookmarkDuplicateStatusException extends BaseException {
    constructor() {
        super(ErrorCode.BOOKMARK_DUPLICATE_STATUS);
    }
}

export class BookmarkInvalidContentIdException extends BaseException {
    constructor() {
        super(ErrorCode.BOOKMARK_INVALID_CONTENT_ID);
    }
}

export class BookmarkDatabaseOperationException extends BaseException {
    constructor() {
        super(ErrorCode.BOOKMARK_DATABASE_OPERATION_FAILED);
    }
}

export class BookmarkDataTransformationFailedException extends BaseException {
    constructor() {
        super(ErrorCode.BOOKMARK_DATA_TRANSFORMATION_FAILED);
    }
}
