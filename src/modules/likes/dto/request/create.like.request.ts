import { IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ContentType } from '@prisma/client';

export class CreateLikeRequest {
    @IsNumber()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '유저 아이디',
    })
    readonly userId: number;

    @IsNumber()
    @Type(() => Number)
    @ApiProperty({
        example: 1,
        description: '좋아요를 누른 콘텐츠 아이디',
    })
    readonly contentId: number;

    @IsEnum(ContentType)
    @ApiProperty({
        example: 'SESSION',
        description: '좋아요를 누른 콘텐츠 타입',
    })
    readonly type: ContentType;
}
