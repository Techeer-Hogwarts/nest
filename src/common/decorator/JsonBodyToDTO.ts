import { Body, Type } from '@nestjs/common';

import { JsonBodyPipe } from '../pipe/jsonBody.pipe';

export function JsonBodyToDTO<T extends object>(
    dto: Type<T>,
): ParameterDecorator {
    const key = dto.name.charAt(0).toLowerCase() + dto.name.slice(1);
    return Body(key, JsonBodyPipe);
}
