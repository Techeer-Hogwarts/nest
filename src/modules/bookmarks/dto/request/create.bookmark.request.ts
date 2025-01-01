import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNumber } from 'class-validator';
import { ContentCategory } from '@prisma/client';
import { Type } from 'class-transformer';

export class CreateBookmarkRequest {
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '북마크를 누른 콘텐츠 아이디',
    })
    readonly contentId: number;

    @IsEnum(ContentCategory)
    @ApiProperty({
        example: 'RESUME',
        description: '북마크를 누른 콘텐츠 타입',
    })
    readonly category: ContentCategory;
}
