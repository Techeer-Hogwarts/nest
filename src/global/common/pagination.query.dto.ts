import { Min, IsInt, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PaginationQueryDto {
    @ApiPropertyOptional({
        description: '오프셋',
        example: 0,
    })
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    readonly offset: number = 0;

    @ApiPropertyOptional({
        description: '가져올 개수',
        example: 10,
    })
    @Type(() => Number)
    @IsInt()
    @Min(0)
    @IsOptional()
    readonly limit: number = 10;
}
