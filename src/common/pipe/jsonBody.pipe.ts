import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
    GlobalInvalidDataTypeBody,
    GlobalInvalidInputValueException,
} from '../exception/global.exception';
import { CustomWinstonLogger } from '../logger/winston.logger';

const PRIMITIVE_TYPES: PrimitiveConstructor[] = [
    String,
    Boolean,
    Number,
    Array,
    Object,
];

@Injectable()
export class JsonBodyPipe implements PipeTransform<string, Promise<unknown>> {
    constructor(private readonly logger: CustomWinstonLogger) {}

    async transform(
        value: string,
        metadata: ArgumentMetadata,
    ): Promise<unknown> {
        const { metatype } = metadata;
        if (!metatype || this.isPrimitive(metatype)) {
            return value;
        }

        let parsed: unknown;

        try {
            parsed = typeof value === 'string' ? JSON.parse(value) : value;
        } catch {
            this.logger.error('JsonBodyPipe InvalidBody', parsed);
            throw new GlobalInvalidDataTypeBody();
        }

        const instance = plainToInstance(metatype, parsed);
        const errors = await validate(instance);
        if (errors.length > 0) {
            this.logger.error('JsonBodyPipe InvalidInstance', errors);
            throw new GlobalInvalidInputValueException();
        }

        return instance;
    }
    private isPrimitive(metatype: unknown): metatype is PrimitiveConstructor {
        return PRIMITIVE_TYPES.includes(metatype as PrimitiveConstructor);
    }
}

type PrimitiveConstructor =
    | StringConstructor
    | BooleanConstructor
    | NumberConstructor
    | ArrayConstructor
    | ObjectConstructor;
