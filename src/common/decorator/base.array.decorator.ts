import { registerDecorator, ValidationOptions } from 'class-validator';

export function IsBaseArray(
    name: string,
    isValid: (val: string) => boolean,
    validationOptions?: ValidationOptions,
): PropertyDecorator {
    return function (target: object, propertyKey: string | symbol): void {
        registerDecorator({
            name,
            target: target.constructor,
            propertyName: propertyKey.toString(),
            options: validationOptions,
            validator: {
                validate(value: unknown): boolean {
                    return (
                        Array.isArray(value) &&
                        value.every(
                            (item) => typeof item === 'string' && isValid(item),
                        )
                    );
                },
            },
        });
    };
}
