import { Transform } from 'class-transformer';
import { ServerException } from '../exception/base.exception';

export function ParseJsonArray(): PropertyDecorator {
    return Transform(({ value }) => {
        if (typeof value === 'string') {
            const parsed = JSON.parse(value);
            if (!Array.isArray(parsed)) throw new ServerException();
            return parsed;
        }
        return value;
    });
}
