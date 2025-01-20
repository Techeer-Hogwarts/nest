import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentCategory } from '../../../../global/common/category/content-category';

export class GetBookmarkListRequest {
    @ApiPropertyOptional({
        description: '카테고리',
        example: 'RESUME',
    })
    @IsEnum(ContentCategory, { message: '존재하지 않는 카테고리입니다.' })
    readonly category: string;

    @ApiPropertyOptional({
        description: '오프셋',
        example: 0,
    })
    @IsOptional()
    @Type(() => Number) // 쿼리 문자열을 숫자로 변환
    @IsNumber()
    readonly offset?: number;

    @ApiPropertyOptional({
        description: '가져올 개수',
        example: 10,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    readonly limit?: number;
}
