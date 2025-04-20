import { applyDecorators } from '@nestjs/common';

import { ValidationOptions } from 'class-validator';

import { IsBaseArray } from './base.array.decorator';
import { TransformToArray } from './transform.array.decorator';

import { isPosition } from '../category/teamCategory/projectPositionType';

export function IsPositionArray(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return applyDecorators(
        TransformToArray(),
        IsBaseArray('isPositionArray', isPosition, validationOptions),
    );
}
