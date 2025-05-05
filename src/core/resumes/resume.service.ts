import { Injectable } from '@nestjs/common';

import { Prisma, User } from '@prisma/client';

import { ResumeEntity } from './entities/resume.entity';
import { ResumeRepository } from './repository/resume.repository';

import { CreateResumeRequest } from '../../common/dto/resumes/request/create.resume.request';
import { GetResumesQueryRequest } from '../../common/dto/resumes/request/get.resumes.query.request';
import { GetResumeResponse } from '../../common/dto/resumes/response/get.resume.response';
import {
    ForbiddenException,
    NotFoundResumeException,
} from '../../common/exception/custom.exception';
import { CustomWinstonLogger } from '../../common/logger/winston.logger';
import { PaginationQueryDto } from '../../common/pagination/pagination.query.dto';
import { GoogleDriveService } from '../../infra/googleDrive/google.drive.service';
import { PrismaService } from '../../infra/prisma/prisma.service';

@Injectable()
export class ResumeService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly resumeRepository: ResumeRepository,
        private readonly googleDriveService: GoogleDriveService,
        private readonly logger: CustomWinstonLogger,
    ) {}

    async getBestResumes(
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const resumes: GetResumeResponse[] =
            await this.resumeRepository.getBestResumes(query);
        this.logger.debug(
            `인기 이력서 목록 조회 후 GetResumeResponse 변환 중`,
            ResumeService.name,
        );
        return resumes;
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
            await this.resumeRepository.unsetMainResumeForUser(user.id);
        }
        // 데이터베이스에 저장
        const resume = await this.resumeRepository.createResume(
            {
                category,
                position,
                title: fullTitle,
                url: resumeUrl,
                isMain,
            },
            user.id,
            prisma ?? this.prismaService,
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
        const resumes: GetResumeResponse[] =
            await this.resumeRepository.getResumeList(query);
        this.logger.debug(
            `${resumes.length}개의 이력서 목록 조회 후 GetResumeResponse 변환 중`,
            ResumeService.name,
        );
        return resumes;
    }

    async getResume(resumeId: number): Promise<GetResumeResponse> {
        this.logger.debug(`이력서 조회 처리 중`, ResumeService.name);
        const resume: ResumeEntity =
            await this.resumeRepository.getResume(resumeId);
        if (!resume) {
            this.logger.error(`이력서를 찾을 수 없음`, ResumeService.name);
            throw new NotFoundResumeException();
        }
        return new GetResumeResponse(resume);
    }

    async getResumesByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const resumes: GetResumeResponse[] =
            await this.resumeRepository.getResumesByUser(userId, query);
        this.logger.debug(
            `${resumes.length}개의 유저 별 이력서 엔티티 목록 조회 후 GetResumeResponse 변환 중`,
            ResumeService.name,
        );
        return resumes;
    }

    // IsDelted -> true, 구글 드라이브 파일은 삭제 폴더로 이동
    async deleteResume(user: User, resumeId: number): Promise<void> {
        this.logger.debug(`이력서 작성자 검사`, ResumeService.name);
        await this.validateAuthor(user, resumeId);
        const resumeTitle =
            await this.resumeRepository.getResumeTitle(resumeId);
        this.logger.debug(
            `구글 드라이브 파일은 삭제 폴더로 이동`,
            ResumeService.name,
        );
        await this.googleDriveService.moveFileToArchive(resumeTitle);
        this.logger.debug(`이력서 삭제 진행 중`, ResumeService.name);
        return this.resumeRepository.deleteResume(resumeId);
    }

    private async validateAuthor(
        user: User,
        resumeId: number,
    ): Promise<ResumeEntity> {
        const resume: ResumeEntity =
            await this.resumeRepository.getResume(resumeId);
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
        await this.resumeRepository.unsetMainResumeForUser(userId);
        this.logger.debug(
            `메인 이력서 해제 후 새로운 메인 이력서 지정 요청 처리 중`,
            ResumeService.name,
        );
        await this.resumeRepository.updateResume(resumeId, { isMain: true });
    }
}
