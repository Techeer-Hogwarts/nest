import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class GetUserssQueryRequest {
    @ApiPropertyOptional({
        description: '직무 (mainPosition)',
        example: 'Backend',
    })
    @IsOptional()
    @IsString()
    readonly position?: string;

    @ApiPropertyOptional({
        description: '테커 기수 (여러 개 선택 가능)',
        example: [6, 7],
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber({}, { each: true }) // 배열 요소가 숫자인지 검증
    readonly year?: number[];

    @ApiPropertyOptional({
        description: '학교 이름 (school)',
        example: '한국공학대학교',
    })
    @IsOptional()
    @IsString()
    readonly university?: string;

    @ApiPropertyOptional({
        description: 'grade',
        example: '1학년',
    })
    @IsOptional()
    @IsString()
    readonly grade?: string;

    @ApiPropertyOptional({
        description: '오프셋',
        example: 0,
    })
    @IsOptional()
    @Type(() => Number)
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
