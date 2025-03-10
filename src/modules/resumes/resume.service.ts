import { Injectable } from '@nestjs/common';
import { ResumeRepository } from './repository/resume.repository';
import { CreateResumeRequest } from './dto/request/create.resume.request';
import { GetResumeResponse } from './dto/response/get.resume.response';
import { ResumeEntity } from './entities/resume.entity';
import { GetResumesQueryRequest } from './dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../global/pagination/pagination.query.dto';
import { Prisma, User } from '@prisma/client';
import {
    ForbiddenException,
    NotFoundResumeException,
} from '../../global/exception/custom.exception';
import { GoogleDriveService } from '../googleDrive/google.drive.service';
import { PrismaService } from '../prisma/prisma.service';
import { CustomWinstonLogger } from '../../global/logger/winston.logger';
import { IndexService } from '../../global/index/index.service';
import { IndexResumeRequest } from './dto/request/index.resume.request';

@Injectable()
export class ResumeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly resumeRepository: ResumeRepository,
        private readonly googleDriveService: GoogleDriveService,
        private readonly logger: CustomWinstonLogger,
        private readonly indexService: IndexService,
    ) {}

    async getBestResumes(
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const { offset = 0, limit = 10 }: PaginationQueryDto = query;
        // 2주 계산
        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
        // SQL 쿼리
        const resumes = await this.prisma.$queryRaw<ResumeEntity[]>(Prisma.sql`
            SELECT * FROM "Resume"
            WHERE "isDeleted" = false
                AND "createdAt" >= ${twoWeeksAgo}
            ORDER BY ("viewCount" + "likeCount" * 10) DESC
            LIMIT ${limit} OFFSET ${offset}
        `);
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
            ResumeRepository.name,
        );
        return resumesWithUser.map((resume) => new GetResumeResponse(resume));
    }

    async createResume(
        createResumeRequest: CreateResumeRequest,
        file: Express.Multer.File,
        user: User,
        prisma: Prisma.TransactionClient = this.prisma,
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
        this.logger.debug(`이력서 저장시작 - resume:}`, ResumeService.name);
        // 데이터베이스에 저장
        const resume = await prisma.resume.create({
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
        const indexResume = new IndexResumeRequest(resume);
        this.logger.debug(
            `이력서 생성 후 인덱스 업데이트 요청 - ${JSON.stringify(indexResume)}`,
            ResumeRepository.name,
        );
        await this.indexService.createIndex<IndexResumeRequest>(
            'resume',
            indexResume,
        );
        return new GetResumeResponse(resume);
    }

    async getResumeList(
        query: GetResumesQueryRequest,
    ): Promise<GetResumeResponse[]> {
        const { position, year, category, offset = 0, limit = 10 } = query;
        this.logger.debug(
            `이력서 목록 조회 요청 - position: ${position}, year: ${year}, category: ${category}, offset: ${offset}, limit: ${limit}`,
            ResumeService.name,
        );

        const resumes: ResumeEntity[] = await this.prisma.resume.findMany({
            where: {
                isDeleted: false,
                ...(position?.length && {
                    // user: { mainPosition: { in: position } }, // 유저 포지션
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
            `${resumes.length}개의 이력서 목록 조회 후 GetResumeResponse 변환 중`,
            ResumeService.name,
        );
        return resumes.map((resume) => new GetResumeResponse(resume));
    }

    async getResume(resumeId: number): Promise<GetResumeResponse> {
        this.logger.debug(`이력서 조회 처리 중`, ResumeService.name);
        this.logger.debug(
            `이력서 상세 조회 - resumeId: ${resumeId}`,
            ResumeService.name,
        );
        const resume: ResumeEntity = await this.prisma.resume
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
            ResumeRepository.name,
        );
        const resumes: GetResumeResponse[] = await this.prisma.resume.findMany({
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
            `${resumes.length}개의 유저 별 이력서 엔티티 목록 조회 후 GetResumeResponse 변환 중`,
            ResumeService.name,
        );
        return resumes.map(
            (resume: ResumeEntity) => new GetResumeResponse(resume),
        );
    }

    // IsDelted -> true, 구글 드라이브 파일은 삭제 폴더로 이동

    async deleteResume(user: User, resumeId: number): Promise<void> {
        try {
            await this.validateAuthor(user, resumeId);
            this.logger.debug(
                `이력서 삭제 처리 시작 - resumeId: ${resumeId}`,
                ResumeService.name,
            );
            const resumeTitle = await this.prisma.resume.findUnique({
                where: { id: resumeId },
                select: { title: true },
            });

            if (!resumeTitle) {
                this.logger.error(
                    `이력서를 찾을 수 없음 - resumeId: ${resumeId}`,
                    ResumeService.name,
                );
                throw new NotFoundResumeException();
            }
            await this.googleDriveService.moveFileToArchive(resumeTitle.title);
            this.logger.debug(
                `구글 드라이브에서 이력서 파일 이동 완료`,
                ResumeService.name,
            );
            await this.prisma.resume.update({
                where: {
                    id: resumeId,
                },
                data: { isDeleted: true },
            });

            this.logger.debug(
                `이력서 삭제 후 인덱스 삭제 요청 - resumeId: ${resumeId}`,
                ResumeService.name,
            );
            await this.indexService.deleteIndex('resume', String(resumeId));

            this.logger.debug(
                `이력서 삭제 완료 - resumeId: ${resumeId}`,
                ResumeService.name,
            );
        } catch (error) {
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(
                    `이력서를 찾을 수 없음 - resumeId: ${resumeId}`,
                    ResumeService.name,
                );
                throw new NotFoundResumeException();
            }
            throw error;
        }
    }

    private async validateAuthor(
        user: User,
        resumeId: number,
    ): Promise<ResumeEntity> {
        const resume: ResumeEntity = await this.prisma.resume
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
        if (resume.userId !== user.id) {
            this.logger.error(`작성자가 일치하지 않음`, ResumeService.name);
            throw new ForbiddenException();
        }
        return resume;
    }

    async updateMainResume(user: any, resumeId: number): Promise<void> {
        const userId = user.id;
        this.logger.debug(
            `메인 이력서 지정 요청 처리 중 - userId: ${userId}, resumeId: ${resumeId}`,
            ResumeService.name,
        );
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
        await this.prisma.resume.update({
            where: {
                id: resumeId,
            },
            data: { isMain: true },
            include: {
                user: true,
            },
        });
        // await this.resumeRepository.updateResume(resumeId, { isMain: true });
    }
}
