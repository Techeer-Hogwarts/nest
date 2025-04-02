import { validate } from 'class-validator';
import { ServerException } from '../exception/base.exception';

export async function validateDtoFields(dto: any): Promise<void> {
    const errors = await validate(dto);
    if (errors.length > 0) {
        throw new ServerException();
    }
    const isEmpty = Object.values(dto).every(
        (value) =>
            value === undefined ||
            value === null ||
            (Array.isArray(value) && value.length === 0),
    );

    if (isEmpty) {
        throw new ServerException();
    }
}
