import { registerDecorator, ValidationOptions } from 'class-validator';
import { isTeamRole } from '../category/teamRole.category';

export function IsTeamRole(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string): void {
        registerDecorator({
            name: 'isTeamRole',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: unknown): boolean {
                    return typeof value === 'string' && isTeamRole(value);
                },
            },
        });
    };
}
