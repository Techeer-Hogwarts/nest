import { Transform } from 'class-transformer';
import { GlobalLogger } from '../logger/global.logger';
import {
    GlobalInvalidDataTypeBody,
    GlobalInvalidInputValueException,
} from '../exception/global.exception';

export function ParseJsonArray(): PropertyDecorator {
    return Transform(({ value }) => {
        if (typeof value === 'string') {
            let parsed: unknown;
            try {
                parsed = JSON.parse(value);
            } catch (e) {
                GlobalLogger.error(`ParseJsonArray parse 에러 : ${value}`, e);
                throw new GlobalInvalidDataTypeBody();
            }
            if (!Array.isArray(parsed)) {
                GlobalLogger.error(
                    `ParseJsonArray 유효하지 않은 JSON array : ${value}`,
                );
                throw new GlobalInvalidInputValueException();
            }
            return parsed;
        }
        return value;
    });
}
