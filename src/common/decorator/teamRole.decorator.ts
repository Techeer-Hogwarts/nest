import { registerDecorator, ValidationOptions } from 'class-validator';
import {
    isTeamRole,
    setTeamRole,
} from '../category/teamCategory/teamRole.category';
import { applyDecorators } from '@nestjs/common';
import { Transform } from 'class-transformer';

export function IsTeamRole(
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return applyDecorators(
        Transform(({ value }) => setTeamRole(value)),
        function (target: object, propertyKey: string | symbol): void {
            registerDecorator({
                name: 'isTeamRole',
                target: target.constructor,
                propertyName: propertyKey.toString(),
                options: validationOptions,
                validator: {
                    validate(value: unknown): boolean {
                        return typeof value === 'string' && isTeamRole(value);
                    },
                },
            });
        },
    );
}
