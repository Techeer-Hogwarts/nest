import {
    IsString,
    IsNumber,
    IsUrl,
    IsOptional,
    IsBoolean,
    MinLength,
    Matches,
    IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserRequest {
    @IsString()
    @ApiProperty({
        example: '김테커',
        description: '사용자 이름',
    })
    readonly name: string;

    @IsEmail({}, { message: '이메일 형식이 올바르지 않습니다.' })
    @ApiProperty({
        example: 'user@example.com',
        description: '사용자 이메일',
    })
    readonly email: string;

    @IsNumber()
    @ApiProperty({
        example: 6,
        description: '테커 기수',
    })
    readonly year: number;

    @Matches(/^(?=.*[a-zA-Z])(?=.*[0-9])(?=.*[!@#$%^&*])/, {
        message: '비밀번호는 영어, 숫자, 특수문자를 포함해야 합니다.',
    })
    @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
    @IsString()
    @ApiProperty({
        example: 'Passw0rd!',
        description: '영어, 숫자, 특수문자를 포함한 비밀번호',
    })
    readonly password: string;

    @IsBoolean()
    @ApiProperty({
        example: false,
        description: 'LFT 여부',
    })
    readonly isLft: boolean;

    @IsUrl()
    @ApiProperty({
        example: 'https://github.com/username',
        description: 'GitHub 프로필 URL',
    })
    readonly githubUrl: string;

    @IsUrl()
    @ApiProperty({
        example: 'https://example.com/blog',
        description: '사용자 블로그 URL',
    })
    readonly blogUrl: string;

    @IsString()
    @ApiProperty({
        example: 'Backend',
        description: '주요 직무',
    })
    readonly mainPosition: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        example: 'Frontend',
        description: '부차적 직무 (선택 사항)',
        required: false,
    })
    readonly subPosition?: string;

    @IsString()
    @ApiProperty({
        example: 'Hogwarts School of Witchcraft and Wizardry',
        description: '학교 이름',
    })
    readonly school: string;

    @IsString()
    @ApiProperty({
        example: '1학년',
        description: '학년',
    })
    readonly class: string;

    @IsOptional()
    @ApiProperty({
        example: 'false',
        description: '인턴 여부',
    })
    readonly isIntern?: boolean;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'crowdStrike',
        description: '인턴 회사 이름',
    })
    readonly internCompanyName?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'Frontend',
        description: '인턴 직무',
    })
    readonly internPosition?: string;

    @IsOptional()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, {
        message: '인턴 시작 날짜는 YYYY-MM-DD 형식이어야 합니다.',
    }) // YYYY-MM-DD 형식에 맞는 정규 표현식
    @ApiProperty({
        example: '2023-01-01',
        description: '인턴 시작 날짜',
        type: String,
    })
    readonly internStartDate?: string;

    @IsOptional()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, {
        message: '인턴 종료 날짜는 YYYY-MM-DD 형식이어야 합니다.',
    }) // YYYY-MM-DD 형식에 맞는 정규 표현식
    @ApiProperty({
        example: '2023-06-01',
        description: '인턴 종료 날짜',
        type: String,
    })
    readonly internEndDate?: string;

    @IsOptional()
    @ApiProperty({
        example: 'false',
        description: '정규직 여부',
    })
    readonly isFullTime?: boolean;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'paloalto',
        description: '정규직 회사 이름',
    })
    readonly fullTimeCompanyName?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'Backend',
        description: '정규직 직무',
    })
    readonly fullTimePosition?: string;

    @IsOptional()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, {
        message: '정규직 시작 날짜는 YYYY-MM-DD 형식이어야 합니다.',
    }) // YYYY-MM-DD 형식에 맞는 정규 표현식
    @ApiProperty({
        example: '2024-01-01',
        description: '정규직 시작 날짜',
        type: String,
    })
    readonly fullTimeStartDate?: string;

    @IsOptional()
    @Matches(/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/, {
        message: '정규직 종료 날짜는 YYYY-MM-DD 형식이어야 합니다.',
    }) // YYYY-MM-DD 형식에 맞는 정규 표현식
    @ApiProperty({
        example: '2024-12-01',
        description: '정규직 종료 날짜',
        type: String,
    })
    readonly fullTimeEndDate?: string;
}
