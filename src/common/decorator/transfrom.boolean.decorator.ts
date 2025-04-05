import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';
import { IsBoolean } from 'class-validator';

export function TransformToBoolean(): PropertyDecorator {
    return applyDecorators(
        Transform(({ value }) => {
            if (value === 'true') return true;
            if (value === 'false') return false;
            return typeof value === 'boolean' ? value : undefined;
        }),
        IsBoolean(),
    );
}
