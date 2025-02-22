import {
    IsString,
    IsOptional,
    IsBoolean,
    IsInt,
    IsArray,
} from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class UpdateProjectTeamRequest {
    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'AI Development Project',
        description: '프로젝트 팀 이름',
    })
    name: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'https://github.com/ai-project',
        description: '깃허브 링크',
    })
    githubLink: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'https://notion.com/ai-project',
        description: '노션 링크',
    })
    notionLink: string;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: 'AI 기반의 새로운 기술을 개발하는 프로젝트입니다.',
        description: '프로젝트 설명',
    })
    projectExplain: string;

    @IsOptional()
    @IsInt()
    @ApiProperty({
        example: 3,
        description: '프론트엔드 인원',
    })
    frontendNum: number;

    @IsOptional()
    @IsInt()
    @ApiProperty({
        example: 2,
        description: '백엔드 인원',
    })
    backendNum: number;

    @IsOptional()
    @IsInt()
    @ApiProperty({
        example: 1,
        description: '데브옵스 인원',
    })
    devopsNum: number;

    @IsOptional()
    @IsInt()
    @ApiProperty({
        example: 1,
        description: 'UI/UX 디자이너 인원',
    })
    fullStackNum: number;

    @IsOptional()
    @IsInt()
    @ApiProperty({
        example: 1,
        description: '데이터 엔지니어 인원',
    })
    dataEngineerNum: number;

    @IsOptional()
    @IsString()
    @ApiProperty({
        example: '열정적으로 참여할 사람을 모집합니다.',
        description: '모집 설명',
    })
    recruitExplain: string;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({
        example: false,
        description: '프로젝트 종료 여부',
    })
    isFinished: boolean;

    @IsOptional()
    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '모집 진행 여부',
    })
    isRecruited: boolean;

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
                    description: '팀 역할',
                    example: 'Backend',
                },
            },
        },
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
        description: '프로젝트 멤버 목록',
    })
    projectMember: {
        userId: number;
        isLeader: boolean;
        teamRole: string;
    }[];

    @IsOptional()
    @IsArray()
    @ApiProperty({
        example: [1, 2, 3],
        description: '삭제할 메인 이미지 ID 배열',
    })
    deleteMainImages: number[];

    @IsOptional()
    @IsArray()
    @ApiProperty({
        example: [1, 2, 3],
        description: '삭제할 이미지 ID 배열',
    })
    deleteResultImages: number[];

    @IsOptional()
    @IsArray()
    @ApiProperty({
        example: [1, 2, 3],
        description: '삭제할 멤버 ID 배열',
    })
    deleteMembers: number[];

    @IsOptional()
    @IsArray()
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
                id: {
                    type: 'number',
                    description: '팀 스택 ID',
                    example: 1,
                },
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
                id: 1,
                stack: 'React.js',
                isMain: true,
            },
            {
                id: 2,
                stack: 'Node.js',
                isMain: false,
            },
        ],
        description: '수정할 팀 스택 목록',
    })
    teamStacks: {
        id: number;
        stack: string;
        isMain: boolean;
    }[];

    @ApiHideProperty() // Swagger에 표시되지 않도록 설정
    resultImages?: string[]; // 사용자가 입력하지 않음, 서버에서 자동 추가

    @ApiHideProperty()
    mainImages?: string[];
}
