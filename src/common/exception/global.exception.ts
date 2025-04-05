import { BaseException } from './base.exception';
import { ErrorCode } from './errorCode';

export class GlobalInvalidInputValueException extends BaseException {
    constructor() {
        super(ErrorCode.GLOBAL_INVALID_INPUT_VALUE);
    }
}

export class GlobalInvalidDataTypeBody extends BaseException {
    constructor() {
        super(ErrorCode.GLOBAL_INVALID_DATA_TYPE);
    }
}
