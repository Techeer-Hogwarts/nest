import {
    IsDateString,
    IsString,
    ValidateIf,
    IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserExperienceRequest {
    @IsString()
    @ApiProperty({
        example: 'Backend',
        description: '직무',
    })
    readonly position: string;

    @IsString()
    @ApiProperty({
        example: 'CrowdStrike',
        description: '회사 이름',
    })
    readonly companyName: string;

    @IsDateString()
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
    @ApiProperty({
        example: '인턴',
        description: '인턴, 정규직, 계약직 등',
    })
    readonly category: string;
}
