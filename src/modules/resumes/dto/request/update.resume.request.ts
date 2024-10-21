import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEnum, IsString, IsUrl } from 'class-validator';
import { ResumeType } from '@prisma/client';

export class UpdateResumeRequest {
    @IsString()
    @ApiProperty({
        example: '홍길동 20241006 스타트업',
        description: '이력서 제목',
    })
    readonly title: string;

    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '원문 url',
    })
    readonly url: string;

    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '대표 지정 여부',
    })
    readonly isMain: boolean;

    @IsEnum(ResumeType)
    @ApiProperty({
        example: 'PORTFOLIO',
        description: '이력서 타입',
        enum: ResumeType,
    })
    readonly type: ResumeType;
}
