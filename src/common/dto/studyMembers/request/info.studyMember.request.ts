import { ApiProperty } from '@nestjs/swagger';
import {
    IsBoolean,
    IsNotEmpty,
    IsNumber,
    IsOptional,
    IsString,
} from 'class-validator';
import { Type } from 'class-transformer';

export class StudyMemberInfoRequest {
    @IsNotEmpty()
    @Type(() => Number)
    @IsNumber()
    @ApiProperty({
        description: '사용자 ID',
        example: 1,
    })
    userId: number;

    @IsNotEmpty()
    @Type(() => Boolean)
    @IsBoolean()
    @ApiProperty({
        description: '리더 여부',
        example: true,
    })
    isLeader: boolean;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    profileImage?: string;

    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    id?: number;
}
