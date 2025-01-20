import { IsBoolean, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ContentCategory } from '../../../../global/common/category/content-category';

export class CreateLikeRequest {
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '좋아요를 누른 콘텐츠 아이디',
    })
    readonly contentId: number;

    @IsEnum(ContentCategory, { message: '존재하지 않는 카테고리입니다.' })
    @ApiProperty({
        example: 'RESUME',
        description: '좋아요를 누른 콘텐츠 타입',
    })
    readonly category: string;

    @IsBoolean()
    @ApiProperty({
        example: 'true',
        description: '좋아요 상태',
    })
    readonly likeStatus: boolean;
}
