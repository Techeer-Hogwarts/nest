import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';
import { INTERACTABLE_CONTENT_TYPES, InteractableContentType } from '../../..//types/content.type.for.interaction';

export class CreateLikeRequest {
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '좋아요를 누른 콘텐츠 아이디',
    })
    readonly contentId: number;

    @IsIn(INTERACTABLE_CONTENT_TYPES, { message: '존재하지 않는 카테고리입니다.' })
    @ApiProperty({
        enum: INTERACTABLE_CONTENT_TYPES,
        example: 'RESUME',
        description: '좋아요를 누른 콘텐츠 타입',
    })
    readonly category: InteractableContentType;

    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '좋아요 상태',
    })
    readonly likeStatus: boolean;
}
