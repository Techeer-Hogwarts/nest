import { ValidationOptions } from 'class-validator';
import { applyDecorators } from '@nestjs/common';
import { isPosition } from '../category/teamCategory/projectPositionType';
import { TransformToArray } from './transform.array.decorator';
import { IsBaseArray } from './base.array.decorator';

export function IsPositionArray(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return applyDecorators(
        TransformToArray(),
        IsBaseArray('isPositionArray', isPosition, validationOptions),
    );
}
