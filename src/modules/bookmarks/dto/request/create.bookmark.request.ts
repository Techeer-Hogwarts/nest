import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { ContentCategory } from '../../../../global/common/category/content-category';

export class CreateBookmarkRequest {
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '북마크를 누른 콘텐츠 아이디',
    })
    readonly contentId: number;

    @IsEnum(ContentCategory, { message: '존재하지 않는 카테고리입니다.' })
    @ApiProperty({
        example: 'RESUME',
        description: '북마크를 누른 콘텐츠 타입',
    })
    readonly category: string;

    @IsBoolean()
    @ApiProperty({
        example: 'true',
        description: '북마크 상태',
    })
    readonly bookmarkStatus: boolean;
}
