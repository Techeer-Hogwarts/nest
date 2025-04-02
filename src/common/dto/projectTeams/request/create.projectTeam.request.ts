import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsInt,
    Min,
    IsArray,
    ArrayNotEmpty,
    ValidateNested,
} from 'class-validator';
import { ApiHideProperty, ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ProjectRecruitmentRequest } from './recruitment.projectTema.request';
import { ProjectMemberInfoRequest } from '../../projectMembers/request/info.projectMember.request';

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
    fullStackNum: number;

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

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ProjectMemberInfoRequest)
    @ApiProperty({
        type: [ProjectMemberInfoRequest],
        example: [
            {
                userId: 1,
                isLeader: true,
                teamRole: 'Frontend',
            },
            {
                userId: 2,
                isLeader: false,
                teamRole: 'Backend',
            },
        ],
    })
    projectMember: ProjectMemberInfoRequest[];

    @IsOptional()
    @IsArray()
    @ArrayNotEmpty()
    @Transform(({ value }) => {
        try {
            return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (e) {
            throw new Error('teamStacks는 유효한 JSON 배열이어야 합니다.');
        }
    })
    @ApiProperty({
        type: 'array',
        items: {
            type: 'object',
            properties: {
                stack: {
                    type: 'string',
                    description: '스택 이름',
                    example: 'React.js',
                },
                isMain: {
                    type: 'boolean',
                    description: '메인 스택 여부',
                    example: true,
                },
            },
        },
        example: [
            {
                stack: 'React.js',
                isMain: true,
            },
            {
                stack: 'Node.js',
                isMain: false,
            },
        ],
    })
    teamStacks?: { stack: string; isMain: boolean }[];

    @ApiHideProperty() // Swagger에 표시되지 않도록 설정
    resultImages?: string[]; // 사용자가 입력하지 않음, 서버에서 자동 추가

    @ApiHideProperty()
    mainImages?: string[];
}
