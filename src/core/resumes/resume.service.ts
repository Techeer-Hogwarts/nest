import { Injectable } from '@nestjs/common';

import { Prisma, User } from '@prisma/client';

import { ResumeEntity } from './entities/resume.entity';

import { CreateResumeRequest } from '../../common/dto/resumes/request/create.resume.request';
import { GetResumesQueryRequest } from '../../common/dto/resumes/request/get.resumes.query.request';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import {
    ForbiddenException,
} from '../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';
import { GoogleDriveService } from '../../infra/googleDrive/google.drive.service';
import { PrismaService } from '../../infra/prisma/prisma.service';
import { IndexResumeRequest } from '../../common/dto/resumes/request/index.resume.request';
import { IndexService } from '../../infra/index/index.service';
import { ResumeNotFoundException } from './exception/resume.exception';

@Injectable()
export class ResumeService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly indexService: IndexService,
        private readonly googleDriveService: GoogleDriveService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async unsetMainResumeForUser(userId: number): Promise<void> {
        await this.prisma.resume.updateMany({
            where: {
                userId: userId,
                isMain: true,
            },
            data: {
                isMain: false,
            },
        });
    }

    async getResume(resumeId: number): Promise<GetResumeResponse> {
        this.logger.debug(
            `이력서 상세 조회 - resumeId: ${resumeId}`,
            ResumeService.name,
        );
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
            .catch((error) => {
                if (
                    error instanceof Prisma.PrismaClientKnownRequestError &&
                    error.code === 'P2025'
                ) {
                    this.logger.error(`이력서를 찾을 수 없음`, ResumeService.name);
                    throw new ResumeNotFoundException();
                }
                throw error;
            });
        this.logger.debug(
            `이력서 상세 조회 및 viewCount 증가 성공`,
            ResumeService.name,
        );
        return new GetResumeResponse(resume);
    }

    async getBestResumes(
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {

        const { offset = 0, limit = 10 } = query;

        const twoWeeksAgo: Date = new Date();
        twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

        const resumes = await this.prisma.resume.findMany({
            where: {
                isDeleted: false,
                createdAt: {
                gte: twoWeeksAgo,
                },
            },
            include: {
                user: true,
            },
                take: limit,
                skip: offset,
            });
        
        resumes.sort((a, b) => 
        (b.viewCount + b.likeCount * 10) - (a.viewCount + a.likeCount * 10)
        );

        this.logger.debug(
            `${resumes.length}개의 인기 이력서 목록 조회 성공`,
            ResumeService.name,
        );

        return resumes.map((resume) => new GetResumeResponse(resume));
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
            await this.unsetMainResumeForUser(user.id);
        }

        // 데이터베이스에 저장
        const resume: ResumeEntity = await prisma.resume.create({
            data: {
                category: createResumeRequest.category,
                position: createResumeRequest.position,
                isMain: createResumeRequest.isMain,
                title: fullTitle,
                url: resumeUrl,
                user: { connect: { id: user.id } },
            },
            include: { user: true },
        });

        // 인덱스 업데이트
        const indexResume = new IndexResumeRequest(resume);
        await this.indexService.createIndex<IndexResumeRequest>(
            'resume',
            indexResume,
        );

        this.logger.debug(
            `이력서 저장 완료 - resume: ${JSON.stringify(resume)}`,
            ResumeService.name,
        );
        return new GetResumeResponse(resume);
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

        const resumes = await this.prisma.resume.findMany({
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

        return resumes.map((resume) => new GetResumeResponse(resume));
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
        await this.validateAuthor(user, resumeId);

        // 이력서 삭제
        try {
            const updatedResume = await this.prisma.resume.update({
                where: {
                    id: resumeId,
                    isDeleted: false,
                },
                data: {
                    isDeleted: true,
                },
            })

            this.logger.debug(
                `이력서 삭제 후 인덱스 삭제 요청, 드라이브 파일 삭제 폴더로 이동 - resumeId: ${resumeId}`,
                ResumeService.name,
            );
            await this.googleDriveService.moveFileToArchive(updatedResume.title);
            await this.indexService.deleteIndex('resume', String(resumeId));
        } catch (error) {
            console.log(error.code)
            if (
                error instanceof Prisma.PrismaClientKnownRequestError &&
                error.code === 'P2025'
            ) {
                this.logger.error(`이력서를 찾을 수 없음`, ResumeService.name);
                throw new ResumeNotFoundException();
            }
            throw error;
        }
    }

    private async validateAuthor(
        user: User,
        resumeId: number,
    ): Promise<ResumeEntity> {
        const resume: ResumeEntity =
            await this.prisma.resume.findUnique({
                where: {
                    id: resumeId,
                    isDeleted: false,
                },
                include: {
                    user: true,
                },
            })
        if (!resume) {
            this.logger.error(`이력서를 찾을 수 없음`, ResumeService.name);
            throw new ResumeNotFoundException();
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
        await this.unsetMainResumeForUser(userId);
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

        this.logger.debug(
            `메인 이력서 지정 요청 처리 완료`,
            ResumeService.name,
        );
    }
}
