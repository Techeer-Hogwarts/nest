import { Transform } from 'class-transformer';
import { ServerException } from '../exception/base.exception';

export function ParseJsonArray(): PropertyDecorator {
    return Transform(({ value }) => {
        if (typeof value === 'string') {
            try {
                const parsed = JSON.parse(value);
                if (!Array.isArray(parsed)) {
                    throw new ServerException();
                }
                return parsed;
            } catch (e) {
                if (e instanceof SyntaxError) {
                    throw new ServerException();
                }
            }
        }
        return value;
    });
}
