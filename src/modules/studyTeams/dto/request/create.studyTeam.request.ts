import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsBoolean,
    IsInt,
    IsArray,
} from 'class-validator';
import { ApiProperty, ApiHideProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class CreateStudyTeamRequest {
    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: 'example.image.png',
        description: '프로필 이미지',
    })
    profileImage: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: 'react study',
        description: '스터디 팀 이름',
    })
    name: string;

    @IsString()
    @ApiProperty({
        example: 'https://github.com/react-study',
        description: '깃허브 링크',
    })
    githubLink: string;

    @IsString()
    @ApiProperty({
        example: 'https://notion.com/react-study',
        description: '노션 링크',
    })
    notionLink: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '리액트에 관한 서적을 읽는 스터디입니다.',
        description: '스터디 설명',
    })
    studyExplain: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '두달에 리액트 관련 서적 완독',
        description: '스터디 목표',
    })
    goal: string;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '매주 일요일 2시에 온라인으로 진행합니다.',
        description: '스터디 진행방식 설명',
    })
    rule: string;

    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '스터디 진행중',
    })
    isFinished: boolean;

    @IsNotEmpty()
    @IsBoolean()
    @ApiProperty({
        example: true,
        description: '스터디 인원 모집 진행중',
    })
    isRecruited: boolean;

    @IsNotEmpty()
    @IsInt()
    @ApiProperty({
        example: 3,
        description: '스터디 모집 인원',
    })
    recruitNum: number;

    @IsNotEmpty()
    @IsString()
    @ApiProperty({
        example: '지각하지 않는 사람과 함께하고 싶습니다!',
        description: '함께하고 싶은 사람 설명',
    })
    recruitExplain: string;

    @IsOptional()
    @IsArray()
    @Transform(({ value }) => {
        try {
            return typeof value === 'string' ? JSON.parse(value) : value;
        } catch (e) {
            throw new Error('studyMember는 유효한 JSON 배열이어야 합니다.');
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
            },
        },
        example: [
            {
                userId: 1,
                isLeader: true,
            },
            {
                userId: 2,
                isLeader: false,
            },
        ],
    })
    studyMember: {
        userId: number;
        isLeader: boolean;
    }[];

    @ApiHideProperty() // Swagger에 표시되지 않도록 설정
    resultImages?: string[]; // 사용자가 입력하지 않음, 서버에서 자동 추가
}
