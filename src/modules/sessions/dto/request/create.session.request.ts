import { ApiProperty } from '@nestjs/swagger';
import { SessionCategory, SessionDate, SessionPosition } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class CreateSessionRequest {
    @IsString()
    @ApiProperty({
        example: 'https://example.com',
        description: '썸네일 url',
    })
    readonly thumbnail: string;

    @IsString()
    @ApiProperty({
        example: '발표와 있어빌리티',
        description: '세션 제목',
    })
    readonly title: string;

    @IsString()
    @ApiProperty({
        example: '최수하',
        description: '발표자',
    })
    readonly presenter: string;

    @IsEnum(SessionDate)
    @ApiProperty({
        example: 'SUMMER_2024',
        description: '세션 기간',
    })
    readonly date: SessionDate;

    @IsEnum(SessionPosition)
    @ApiProperty({
        example: 'BACKEND',
        description: '포지션',
    })
    readonly position: SessionPosition;

    @IsEnum(SessionCategory)
    @ApiProperty({
        example: 'BOOTCAMP',
        description: '카테고리',
    })
    readonly category: SessionCategory;

    @IsString()
    @ApiProperty({
        example: 'https://example.com',
        description: '세션 영상 url',
    })
    readonly videoUrl: string;

    @IsString()
    @ApiProperty({
        example: 'https://example.com',
        description: '발표 자료 url',
    })
    readonly fileUrl: string;
}
