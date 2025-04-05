import { Transform } from 'class-transformer';

export function TransformToArray(): PropertyDecorator {
    return Transform(({ value }) => {
        if (typeof value === 'string') return [value];
        if (Array.isArray(value)) return value;
        return [];
    });
}
