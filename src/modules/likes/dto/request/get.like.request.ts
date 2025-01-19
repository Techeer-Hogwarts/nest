import { ContentCategory } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class GetLikeRequest {
    @ApiPropertyOptional({
        description: '콘텐츠 아이디',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    readonly contentId: number;

    @ApiPropertyOptional({
        description: '카테고리',
        example: 'BLOG',
    })
    @IsEnum(ContentCategory)
    readonly category: ContentCategory;
}
