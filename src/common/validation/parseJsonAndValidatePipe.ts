import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import {
    GlobalInvalidDataTypeBody,
    GlobalInvalidInputValueException,
} from '../exception/global.exception';
import { CustomWinstonLogger } from '../logger/winston.logger';

@Injectable()
export class ParseJsonAndValidatePipe implements PipeTransform {
    private readonly logger = new CustomWinstonLogger();
    /**
     * 들어온 값을 JSON으로 파싱하고 DTO로 변환 후 유효성 검사를 수행합니다.
     * @param value - JSON 문자열로 전달된 값.
     * @param metatype - 유효성 검사에 사용될 DTO 타입 정보.
     * @returns 유효성 검사를 통과한 DTO 객체.
     */
    async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
        this.logger.debug('Start transforming');
        if (!metatype || !this.isValidMetatype(metatype)) {
            this.logger.debug('Invalid metatype, skipping validation');
            return value;
        }

        let parsedValue: unknown;
        try {
            this.logger.debug('Parsing JSON');
            parsedValue = JSON.parse(value);
            this.logger.debug('Parsed value:', parsedValue);
        } catch (error) {
            this.logger.error('Error occurred during transformation', {
                error,
            });
            throw new GlobalInvalidDataTypeBody(); // Exception Filter로 전달
        }
        const object = plainToInstance(metatype, parsedValue);
        const errors = await validate(object);
        if (errors.length > 0) {
            this.logger.error('Validation failed', { errors });
            throw new GlobalInvalidInputValueException();
        }

        this.logger.debug('Validation succeeded');
        return object;
    }

    /**
     * 주어진 metatype이 유효성 검사 대상인지 확인합니다.
     * @param metatype - 검사할 타입 정보.
     * @returns 유효성 검사 대상이면 true, 아니면 false.
     */
    private isValidMetatype(metatype: new (...args: any[]) => any): boolean {
        const types: Array<new (...args: any[]) => any> = [
            String,
            Boolean,
            Number,
            Array,
            Object,
        ];
        return !types.includes(metatype);
    }
}
