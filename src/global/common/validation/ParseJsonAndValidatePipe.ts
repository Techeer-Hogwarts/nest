import {
    ArgumentMetadata,
    Injectable,
    PipeTransform,
    BadRequestException,
} from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

@Injectable()
export class ParseJsonAndValidatePipe implements PipeTransform {
    /**
     * 들어온 값을 JSON으로 파싱하고 DTO로 변환 후 유효성 검사를 수행합니다.
     * @param value - JSON 문자열로 전달된 값.
     * @param metatype - 유효성 검사에 사용될 DTO 타입 정보.
     * @returns 유효성 검사를 통과한 DTO 객체.
     */
    async transform(value: any, { metatype }: ArgumentMetadata): Promise<any> {
        // metatype이 유효한 타입이 아닌 경우 그대로 반환
        if (!metatype || !this.isValidMetatype(metatype)) {
            return value;
        }

        let parsedValue: any;
        try {
            parsedValue = JSON.parse(value); // JSON 문자열 파싱
        } catch (error) {
            throw new BadRequestException('JSON 형식이 잘못되었습니다.');
        }

        // 파싱된 값을 DTO로 변환 후 유효성 검사
        const object = plainToInstance(metatype, parsedValue);
        const errors = await validate(object);

        if (errors.length > 0) {
            throw new BadRequestException(errors); // 유효성 검사 실패 시 예외 발생
        }

        return object; // 유효성 검사를 통과한 객체 반환
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
