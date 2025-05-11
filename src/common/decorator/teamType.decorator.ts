import { applyDecorators } from '@nestjs/common';

import { ValidationOptions } from 'class-validator';

import { IsBaseArray } from './base.array.decorator';
import { TransformToArray } from './transform.array.decorator';

import { isTeamType } from '../category/teamCategory/teamType';

export function IsTeamTypeArray(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return applyDecorators(
        TransformToArray(),
        IsBaseArray('isTeamTypeArray', isTeamType, validationOptions),
    );
}
