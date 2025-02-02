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
import { GoogleDriveService } from '../../googleDrive/google.drive.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ResumeService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly resumeRepository: ResumeRepository,
        private readonly googleDriveService: GoogleDriveService,
    ) {}

    async getBestResumes(
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const resumes: ResumeEntity[] =
            await this.resumeRepository.getBestResumes(query);
        return resumes.map(
            (resume: ResumeEntity) => new GetResumeResponse(resume),
        );
    }

    async createResume(
        createResumeRequest: CreateResumeRequest,
        file: Express.Multer.File,
        user: User,
        prisma?: Prisma.TransactionClient,
    ): Promise<GetResumeResponse> {
        const { title, category, position, isMain } = createResumeRequest;

        if (!file) {
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

        // Google Drive에 파일 업로드
        const resumeUrl = await this.googleDriveService.uploadFileBuffer(
            file.buffer, // 파일의 buffer 추출
            fullTitle,
        );

        // 메인 이력서 중복 방지 처리
        if (isMain) {
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

        return new GetResumeResponse(resume);
    }

    async getResumeList(
        query: GetResumesQueryRequest,
    ): Promise<GetResumeResponse[]> {
        const resumes: ResumeEntity[] =
            await this.resumeRepository.getResumeList(query);
        return resumes.map(
            (resume: ResumeEntity) => new GetResumeResponse(resume),
        );
    }

    async getResume(resumeId: number): Promise<GetResumeResponse> {
        const resume: ResumeEntity =
            await this.resumeRepository.getResume(resumeId);
        if (!resume) {
            throw new NotFoundResumeException();
        }
        return new GetResumeResponse(resume);
    }

    async getResumesByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        const resumes: ResumeEntity[] =
            await this.resumeRepository.getResumesByUser(userId, query);
        return resumes.map(
            (resume: ResumeEntity) => new GetResumeResponse(resume),
        );
    }

    // IsDelted -> true, 구글 드라이브 파일은 삭제 폴더로 이동
    async deleteResume(user: User, resumeId: number): Promise<void> {
        await this.validateAuthor(user, resumeId);
        const resumeTitle =
            await this.resumeRepository.getResumeTitle(resumeId);
        await this.googleDriveService.moveFileToArchive(resumeTitle);
        return this.resumeRepository.deleteResume(resumeId);
    }

    private async validateAuthor(
        user: User,
        resumeId: number,
    ): Promise<ResumeEntity> {
        const resume: ResumeEntity =
            await this.resumeRepository.getResume(resumeId);
        if (!resume) {
            throw new NotFoundResumeException();
        }
        if (resume.userId !== user.id) {
            throw new ForbiddenException();
        }
        return resume;
    }

    async updateMainResume(user: any, resumeId: number): Promise<void> {
        const userId = user.id;
        await this.resumeRepository.unsetMainResumeForUser(userId);
        await this.resumeRepository.updateResume(resumeId, { isMain: true });
    }
}
