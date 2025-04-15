import { ValidationOptions } from 'class-validator';
import { isTeamType } from '../category/teamCategory/teamType';
import { applyDecorators } from '@nestjs/common';
import { TransformToArray } from './transform.array.decorator';
import { IsBaseArray } from './base.array.decorator';

export function IsTeamTypeArray(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return applyDecorators(
        TransformToArray(),
        IsBaseArray('isTeamTypeArray', isTeamType, validationOptions),
    );
}
