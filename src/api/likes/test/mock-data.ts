// import { LikeEntity } from '../entities/like.entity';
// import { CreateLikeRequest } from '../dto/request/create.like.request';
// import { GetLikeListRequest } from '../dto/request/get.like-list.request';
// import { GetLikeResponse } from '../dto/response/get.like.response';
// import { Request } from 'express';

// export const likeEntity = (overrides?: Partial<LikeEntity>): LikeEntity => {
//     return {
//         id: 1,
//         createdAt: new Date('2024-09-24T08:51:54.000Z'),
//         updatedAt: new Date('2024-09-24T08:51:54.000Z'),
//         isDeleted: false,
//         userId: 1,
//         contentId: 1,
//         category: 'RESUME',
//         ...overrides,
//     };
// };

// export const likeEntities: LikeEntity[] = [
//     likeEntity({
//         id: 1,
//         contentId: 1,
//     }),
//     likeEntity({
//         id: 2,
//         contentId: 2,
//     }),
// ];

// export const createLikeRequest = (
//     overrides?: Partial<CreateLikeRequest>,
// ): CreateLikeRequest => {
//     return {
//         contentId: 1,
//         category: 'RESUME',
//         likeStatus: true,
//         ...overrides,
//     };
// };

// export const getLikeListRequest = (
//     overrides?: Partial<GetLikeListRequest>,
// ): GetLikeListRequest => {
//     return {
//         category: 'RESUME',
//         offset: 0,
//         limit: 10,
//         ...overrides,
//     };
// };

// export const getLikeResponse: GetLikeResponse = new GetLikeResponse(
//     likeEntity(),
// );

// export const user = {
//     id: 1,
//     createdAt: new Date('2024-09-24T08:51:54.000Z'),
//     updatedAt: new Date('2024-09-24T08:51:54.000Z'),
//     isDeleted: false,
//     name: '홍길동',
//     email: 'hong@test.com',
//     nickname: 'hong123', // 예시 데이터 추가
//     year: 2024,
//     password: '1234',
//     isLft: false,
//     githubUrl: 'github',
//     blogUrl: 'blog',
//     mainPosition: 'Backend',
//     subPosition: 'DevOps',
//     school: 'Test University',
//     class: '4학년',
//     profileImage: 'profile-image-url',
//     stack: [], // 빈 배열 기본값
//     isAuth: true,
//     isIntern: true,
//     internPosition: 'Intern Developer',
//     internCompanyName: 'Intern Corp',
//     internStartDate: new Date('2024-01-01T00:00:00.000Z'),
//     internEndDate: new Date('2024-06-01T00:00:00.000Z'),
//     fullTimePosition: 'Full-Time Developer',
//     isFullTime: false,
//     fullTimeCompanyName: 'Full-Time Corp',
//     fullTimeStartDate: new Date('2024-07-01T00:00:00.000Z'),
//     fullTimeEndDate: new Date('2024-12-31T00:00:00.000Z'),
//     roleId: 1,
// };

// export const request: Request = {
//     user: user,
// } as unknown as Request;
