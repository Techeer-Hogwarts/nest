import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { ResumeCategory } from '@prisma/client';
import {
    IsEnum,
    IsString,
    IsUrl,
    IsOptional,
    IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateResumeRequest {
    @IsOptional()
    @IsUrl()
    @ApiHideProperty() // Swagger에서 이 필드를 숨김
    readonly url: string;

    @IsEnum(ResumeCategory)
    @ApiProperty({
        example: 'PORTFOLIO',
        description: '이력서 타입',
    })
    readonly category: ResumeCategory;

    @IsString()
    @ApiProperty({
        example: 'BACKEND',
        description: '이력서 포지션',
    })
    readonly position: string;

    @IsString()
    @ApiProperty({
        example: '스타트업',
        description: '이력서 제목에 추가할 부가 설명',
    })
    readonly title?: string;

    @IsBoolean()
    @Transform(({ value }) => value === 'true' || value === true)
    @ApiProperty({
        example: true,
        description: '이력서 대표 지정 여부',
    })
    readonly isMain: boolean;
}
