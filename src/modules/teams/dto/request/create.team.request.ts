import {
    IsString,
    IsNotEmpty,
    IsArray,
    IsBoolean,
    IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateAnnouncementRequest {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: 'TecheerZip',
        description: '팀 이름',
    })
    name: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '프로젝트',
        description: '팀 종류',
    })
    category: string;

    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '모집 여부',
    })
    isRecruited: boolean;

    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '진행 여부',
    })
    isFinished: boolean;

    @IsArray()
    @IsOptional()
    @ApiProperty({
        example: [1, 2, 3],
        description: '스택 ID 배열',
    })
    stacks?: number[];
}
