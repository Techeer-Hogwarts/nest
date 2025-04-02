import { IsIn, IsNumber, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { INTERACTABLE_CONTENT_TYPES, InteractableContentType } from '../../../types/content.type.for.interaction';

export class GetLikeListRequest {
    @IsIn(INTERACTABLE_CONTENT_TYPES, { message: '존재하지 않는 카테고리입니다.' })
    @ApiProperty({
        enum: INTERACTABLE_CONTENT_TYPES,
        example: 'RESUME',
        description: '좋아요를 누른 콘텐츠 타입',
    })
    readonly category: InteractableContentType;

    @IsNumber()
    @Min(0)
    @Type(() => Number)
    @ApiProperty({
        example: 0,
        description: '조회 시작 위치',
    })
    readonly offset: number;

    @IsNumber()
    @Min(1)
    @Type(() => Number)
    @ApiProperty({
        example: 10,
        description: '조회할 데이터 개수',
    })
    readonly limit: number;
}
