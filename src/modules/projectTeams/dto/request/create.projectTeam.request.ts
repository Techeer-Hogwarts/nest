import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    IsArray,
} from 'class-validator';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateProjectTeamRequest {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: 'TecheerZip',
        description: '프로젝트 팀 이름',
    })
    name: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '테커를 위한 서비스',
        description: '프로젝트 설명',
    })
    projectExplain: string;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    @ApiProperty({
        example: 3,
        description: '프론트엔드 모집 인원',
    })
    frontendNum: number;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    @ApiProperty({
        example: 2,
        description: '백엔드 모집 인원',
    })
    backendNum: number;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    @ApiProperty({
        example: 1,
        description: '데브옵스 모집 인원',
    })
    devopsNum: number;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    @ApiProperty({
        example: 1,
        description: 'UI/UX 모집 인원',
    })
    uiuxNum: number;

    @IsNotEmpty()
    @IsInt()
    @Min(0)
    @ApiProperty({
        example: 1,
        description: '데이터 엔지니어 모집 인원',
    })
    dataEngineerNum: number;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: '백엔드에 관심 있는 분을 모집합니다.',
        description: '모집 설명',
    })
    recruitExplain?: string;

    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '모집 여부',
    })
    isRecruited: boolean;

    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty({
        example: false,
        description: '진행 여부',
    })
    isFinished: boolean;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'https://github.com/techeerism',
        description: '깃허브 링크',
    })
    githubLink?: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'https://notion.so/techeerism',
        description: '노션 링크',
    })
    notionLink?: string;

    @IsArray()
    @IsOptional()
    @ApiProperty({
        example: [1, 2, 3],
        description: '스택 ID 배열',
    })
    stacks?: number[];

    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
        try {
            return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (e) {
            throw new Error('projectMember는 유효한 JSON 배열이어야 합니다.');
        }
    })
    @ApiProperty({
        type: 'array',
        items: {
            type: 'object',
            properties: {
                userId: {
                    type: 'number',
                    description: '사용자 ID',
                    example: 1,
                },
                isLeader: {
                    type: 'boolean',
                    description: '리더 여부',
                    example: true,
                },
                teamRole: {
                    type: 'string',
                    description: '팀 내 역할',
                    example: 'Frontend Developer',
                },
            },
        },
        example: [
            {
                userId: 1,
                isLeader: true,
                teamRole: 'Frontend Developer',
            },
            {
                userId: 2,
                isLeader: false,
                teamRole: 'Backend Developer',
            },
        ],
    })
    projectMember: {
        userId: number;
        isLeader: boolean;
        teamRole: string;
    }[];

    @ApiHideProperty() // Swagger에 표시되지 않도록 설정
    resultImages?: string[]; // 사용자가 입력하지 않음, 서버에서 자동 추가
}
