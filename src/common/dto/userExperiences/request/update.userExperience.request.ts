import { ApiProperty } from '@nestjs/swagger';
import {
    IsDateString,
    IsString,
    ValidateIf,
    IsOptional,
    IsInt,
} from 'class-validator';

export class UpdateUserExperienceRequest {
    @IsInt()
    @IsOptional()
    @ApiProperty({
        example: 1,
        description: '경력 ID',
    })
    readonly experienceId?: number;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Backend',
        description: '직무',
    })
    readonly position: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'CrowdStrike',
        description: '회사 이름',
    })
    readonly companyName: string;

    @IsDateString()
    @IsOptional()
    @ApiProperty({
        example: '2021-01-01',
        description: '시작 날짜',
    })
    readonly startDate: string;

    @IsDateString()
    @IsOptional()
    @ValidateIf((o) => o.isFinished === true)
    @ApiProperty({
        example: '2021-06-01',
        description: '종료 날짜',
    })
    readonly endDate: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'intern',
        description: '인턴, 정규직, 계약직 등',
    })
    readonly category: string;
}
