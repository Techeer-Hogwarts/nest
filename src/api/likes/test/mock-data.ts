import { Request } from 'express';
import { Like, User } from '@prisma/client';
import { CreateLikeRequest } from '../../../common/dto/likes/request/create.like.request';
import { GetLikeListRequest } from '../../../common/dto/likes/request/get.like-list.request';
import { GetLikeResponse } from '../../../common/dto/likes/response/get.like.response';
import { GetResumeResponse } from '../../../common/dto/resumes/response/get.resume.response';

// RequestWithUser 인터페이스 정의
interface RequestWithUser extends Request {
    user: User;
}

export const likeEntity = (overrides?: Partial<Like>): Like => {
    return {
        id: 1,
        createdAt: new Date('2024-09-24T08:51:54.000Z'),
        updatedAt: new Date('2024-09-24T08:51:54.000Z'),
        isDeleted: false,
        userId: 1,
        contentId: 1,
        category: 'RESUME',
        ...overrides,
    };
};

export const likeEntities: Like[] = [
    likeEntity({
        id: 1,
        contentId: 1,
    }),
    likeEntity({
        id: 2,
        contentId: 2,
    }),
];

export const createLikeRequest = (
    overrides?: Partial<CreateLikeRequest>,
): CreateLikeRequest => {
    return {
        contentId: 1,
        category: 'RESUME',
        likeStatus: true,
        ...overrides,
    };
};

export const getLikeListRequest = (
    overrides?: Partial<GetLikeListRequest>,
): GetLikeListRequest => {
    return {
        category: 'RESUME',
        offset: 0,
        limit: 10,
        ...overrides,
    };
};

export const getLikeResponse: GetLikeResponse = new GetLikeResponse(
    likeEntity(),
);

export const mockUser = {
    id: 1,
    createdAt: new Date('2024-09-24T08:51:54.000Z'),
    updatedAt: new Date('2024-09-24T08:51:54.000Z'),
    isDeleted: false,
    name: '홍길동',
    email: 'hong@test.com',
    nickname: 'hong123',
    year: 6,
    password: '1234',
    isLft: false,
    githubUrl: 'github',
    mainPosition: 'Backend',
    subPosition: 'DevOps',
    school: 'Test University',
    profileImage: 'profile-image-url',
    stack: [],
    isAuth: true,
    roleId: 1,
    grade: '4학년',
    mediumUrl: 'medium',
    tistoryUrl: 'tistory',
    velogUrl: 'velog',
    class: '4학년',
};

export const request: RequestWithUser = {
    user: mockUser,
} as unknown as RequestWithUser;

export const resumeMockResponse = (
    overrides?: Partial<GetResumeResponse>,
): GetResumeResponse => ({
    id: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
    title: '이력서 제목',
    url: 'https://example.com/resume',
    isMain: true,
    position: 'BACKEND',
    likeCount: 10,
    viewCount: 100,
    category: 'RESUME',
    user: mockUser,
    ...overrides,
});
