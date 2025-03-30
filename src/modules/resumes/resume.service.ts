import { Injectable } from '@nestjs/common';
import { sql } from 'kysely';
import { Prisma, Resume, User } from '@prisma/client';
import { PrismaService } from '../../infra/prisma/prisma.service';

import {
    ForbiddenException,
    NotFoundResumeException,
} from '../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';

import { GoogleDriveService } from '../../infra/googleDrive/google.drive.service';
import { IndexService } from '../../infra/index/index.service';

import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import { CreateResumeRequest } from '../../common/dto/resumes/request/create.resume.request';
import { GetResumesQueryRequest } from '../../common/dto/resumes/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';
import { IndexResumeRequest } from '../../common/dto/resumes/request/index.resume.request';

@Injectable()
export class ResumeService {
    constructor(
        private readonly googleDriveService: GoogleDriveService,
        private readonly logger: CustomWinstonLogger,
        private readonly prisma: PrismaService,
        private readonly indexService: IndexService,
    ) {}

    async getBestResumes(
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;

        // 2주 전 날짜 계산
        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        // Kysely를 사용한 쿼리 실행
        const resumes = await this.prisma.$kysely
            .selectFrom('Resume')
            .selectAll()
            .where('isDeleted', '=', false)
            .where('createdAt', '>=', twoWeeksAgo)
            .orderBy(sql`"viewCount" + "likeCount" * 10`, 'desc')
            .limit(limit)
            .offset(offset)
            .execute();

        // 사용자 정보 추가
        const resumesWithUser = await Promise.all(
            resumes.map(async (resume) => {
                const user = await this.prisma.user.findUnique({
                    where: { id: resume.userId },
                });
                return {
                    ...resume,
                    user,
                };
            }),
        );

        this.logger.debug(
            `${resumesWithUser.length}개의 인기 이력서 목록 조회 성공`,
            ResumeService.name,
        );

        return resumesWithUser.map((resume) => new GetResumeResponse(resume));
    }

    async createResume(
        createResumeRequest: CreateResumeRequest,
        file: Express.Multer.File,
        user: User,
        prisma?: Prisma.TransactionClient,
    ): Promise<GetResumeResponse> {
        const { title, category, position, isMain } = createResumeRequest;
        this.logger.debug(
            `이력서 생성 요청 처리 중 - title: ${title}, category: ${category}, position: ${position}, isMain: ${isMain}`,
            ResumeService.name,
        );
        if (!file) {
            this.logger.error(`파일을 찾을 수 없음`, ResumeService.name);
            throw new Error('File is required for creating a resume.');
        }

        // 제목 생성
        const currentDateTime = new Date();
        const formattedDate = currentDateTime
            .toISOString()
            .replace('T', '-')
            .replace(/:/g, '')
            .split('.')[0]
            .slice(0, -2);
        const baseTitle = `${user.name}-${formattedDate}`;
        const fullTitle = title ? `${baseTitle}-${title}` : baseTitle;
        this.logger.debug(
            `파일 제목 생성 완료 - fullTitle: ${fullTitle}`,
            ResumeService.name,
        );

        // Google Drive에 파일 업로드
        const resumeUrl = await this.googleDriveService.uploadFileBuffer(
            file.buffer, // 파일의 buffer 추출
            fullTitle,
        );
        this.logger.debug(
            `Google Drive에 파일 업로드 완료 - resumeUrl: ${resumeUrl}`,
            ResumeService.name,
        );

        // 메인 이력서 중복 방지 처리
        if (isMain) {
            this.logger.debug(
                `메인 이력서로 설정된 경우, 기존 메인 이력서 해제 중`,
                ResumeService.name,
            );

            await this.prisma.resume.updateMany({
                where: {
                    userId: user.id,
                    isMain: true,
                },
                data: {
                    isMain: false,
                },
            });
        }
        // 데이터베이스에 이력서 저장 및 인덱스 업데이트
        const resume = await (prisma ?? this.prisma).resume.create({
            data: {
                category,
                position,
                title: fullTitle,
                url: resumeUrl,
                isMain,
                user: { connect: { id: user.id } },
            },
            include: { user: true },
        });

        this.logger.debug(
            `이력서 저장 완료 - resume: ${JSON.stringify(resume)}`,
            ResumeService.name,
        );

        // 인덱스 업데이트 요청
        const indexResume = new IndexResumeRequest(resume); // resume 데이터를 기반으로 인덱스를 만들기
        this.logger.debug(
            `이력서 생성 후 인덱스 업데이트 요청 - ${JSON.stringify(indexResume)}`,
            ResumeService.name,
        );

        await this.indexService.createIndex<IndexResumeRequest>(
            'resume', // 인덱스 이름
            indexResume, // 인덱스에 저장할 데이터
        );

        return new GetResumeResponse(resume); // 수정된 이력서를 반환
    }

    async getResumeList(
        query: GetResumesQueryRequest,
    ): Promise<GetResumeResponse[]> {
        const {
            position,
            year,
            category,
            offset = 0,
            limit = 10,
        }: GetResumesQueryRequest = query;
        this.logger.debug(
            `이력서 목록 조회 - position: ${position}, year: ${year}, category: ${category}, offset: ${offset}, limit: ${limit}`,
            ResumeService.name,
        );
        const resumes = await this.prisma.resume.findMany({
            where: {
                isDeleted: false,
                ...(position?.length && {
                    position: { in: position },
                }),
                ...(year?.length && {
                    user: { year: { in: year } },
                }),
                ...(category?.length && {
                    category,
                }),
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
            orderBy: {
                title: 'asc',
            },
        });
        this.logger.debug(
            `${resumes.length}개의 이력서 목록 조회 성공`,
            ResumeService.name,
        );
        return resumes.map((resume) => new GetResumeResponse(resume));
    }

    async getResume(resumeId: number): Promise<GetResumeResponse> {
        this.logger.debug(`이력서 조회 처리 중`, ResumeService.name);
        const resume = await this.prisma.resume
            .update({
                where: {
                    id: resumeId,
                    isDeleted: false,
                },
                data: {
                    viewCount: {
                        increment: 1,
                    },
                },
                include: {
                    user: true,
                },
            })
            .catch(() => null);
        if (!resume) {
            this.logger.error(`이력서를 찾을 수 없음`, ResumeService.name);
            throw new NotFoundResumeException();
        }
        this.logger.debug(
            `이력서 상세 조회 및 viewCount 증가 성공`,
            ResumeService.name,
        );
        return new GetResumeResponse(resume);
    }
    async getResumesByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        this.logger.debug(
            `유저 별 이력서 조회 - userId: ${userId}, offset: ${offset}, limit: ${limit}`,
            ResumeService.name,
        );
        const resumes = await this.prisma.resume.findMany({
            where: {
                isDeleted: false,
                userId: userId,
            },
            include: {
                user: true,
            },
            skip: offset,
            take: limit,
            orderBy: {
                title: 'asc',
            },
        });
        this.logger.debug(
            `${resumes.length}개의 유저 별 이력서 목록 조회 성공`,
            ResumeService.name,
        );
        return resumes.map((resume) => new GetResumeResponse(resume));
    }

    // IsDelted -> true, 구글 드라이브 파일은 삭제 폴더로 이동
    async deleteResume(user: User, resumeId: number): Promise<void> {
        this.logger.debug(`이력서 작성자 검사`, ResumeService.name);
        await this.validateAuthor(resumeId, user);

        // 이력서 제목과 삭제 처리 한 번에 가져오기
        const resume = await this.prisma.resume.findUnique({
            where: {
                id: resumeId,
                isDeleted: false,
            },
            select: {
                title: true,
            },
        });

        if (!resume) {
            this.logger.error(`이력서를 찾을 수 없음`, ResumeService.name);
            throw new NotFoundResumeException();
        }

        const { title } = resume;

        this.logger.debug(
            `구글 드라이브 파일은 삭제 폴더로 이동`,
            ResumeService.name,
        );
        await this.googleDriveService.moveFileToArchive(title);

        this.logger.debug(`이력서 삭제 진행 중`, ResumeService.name);

        // 이력서 삭제 및 인덱스 삭제
        try {
            await this.prisma.resume.update({
                where: {
                    id: resumeId,
                    isDeleted: false,
                },
                data: { isDeleted: true },
            });

            this.logger.debug(
                `이력서 삭제 후 인덱스 삭제 요청 - resumeId: ${resumeId}`,
                ResumeService.name,
            );
            await this.indexService.deleteIndex('resume', String(resumeId));
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(`이력서를 찾을 수 없음`, ResumeService.name);
                throw new NotFoundResumeException();
            }
            throw error;
        }
    }
    async validateAuthor(resumeId: number, user: User): Promise<Resume> {
        this.logger.debug(
            `이력서 상세 조회 - resumeId: ${resumeId}`,
            ResumeService.name,
        );

        // 이력서 조회 및 viewCount 증가
        const resume = await this.prisma.resume
            .update({
                where: {
                    id: resumeId,
                    isDeleted: false,
                },
                data: {
                    viewCount: {
                        increment: 1, // Prisma의 `increment`를 사용하여 viewCount 증가
                    },
                },
                include: {
                    user: true,
                },
            })
            .catch(() => null); // 예외 발생 시 null 반환

        if (!resume) {
            this.logger.error(`이력서를 찾을 수 없음`, ResumeService.name);
            throw new NotFoundResumeException();
        }

        // 작성자 확인
        if (resume.userId !== user.id) {
            this.logger.error(`작성자가 일치하지 않음`, ResumeService.name);
            throw new ForbiddenException();
        }

        this.logger.debug(
            `이력서 상세 조회 및 viewCount 증가 성공`,
            ResumeService.name,
        );

        return resume;
    }

    async updateMainResume(user: any, resumeId: number): Promise<void> {
        const userId = user.id;
        this.logger.debug(
            `메인 이력서 지정 요청 처리 중 - userId: ${userId}, resumeId: ${resumeId}`,
            ResumeService.name,
        );

        // 기존에 메인 이력서를 해제
        await this.prisma.resume.updateMany({
            where: {
                userId: userId,
                isMain: true,
            },
            data: {
                isMain: false,
            },
        });
        this.logger.debug(
            `메인 이력서 해제 후 새로운 메인 이력서 지정 요청 처리 중`,
            ResumeService.name,
        );

        // 새로운 이력서를 메인으로 지정
        await this.prisma.resume.update({
            where: {
                id: resumeId,
            },
            data: {
                isMain: true,
            },
            include: {
                user: true,
            },
        });

        this.logger.debug(`메인 이력서 지정 성공`, ResumeService.name);
    }
}
