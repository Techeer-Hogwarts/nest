import { Injectable } from '@nestjs/common';
import { ResumeRepository } from './repository/resume.repository';
import { CreateResumeRequest } from './dto/request/create.resume.request';
import { GetResumeResponse } from './dto/response/get.resume.response';
import { ResumeEntity } from './entities/resume.entity';
import { GetResumesQueryRequest } from './dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
import { UpdateResumeRequest } from './dto/request/update.resume.request';
import { User } from '@prisma/client';
import {
    ForbiddenException,
    NotFoundResumeException,
} from '../../global/exception/custom.exception';

@Injectable()
export class ResumeService {
    constructor(private readonly resumeRepository: ResumeRepository) {}

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
        user: User,
    ): Promise<GetResumeResponse> {
        const currentDateTime: Date = new Date();
        const formattedDate: string = currentDateTime
            .toISOString() // ISO 형식 문자열로 변환
            .replace('T', '-') // 날짜와 시간을 구분하는 T를 -로 변경
            .replace(/:/g, '') // 시간 값의 콜론(:) 제거
            .split('.')[0] // 소수점 이하(밀리초)와 Z 제거
            .slice(0, -2); // 초 부분 제거

        // 제목 생성 로직
        const baseTitle: string = `${user.name}-${formattedDate}`;
        const fullTitle: string = createResumeRequest.title
            ? `${baseTitle}-${createResumeRequest.title}`
            : baseTitle; // 부가 설명이 있는 경우 첨부

        // 구글 드라이브 업로드
        const resumeUrl: string = createResumeRequest.url;
        const newResumeDto: CreateResumeRequest = {
            ...createResumeRequest,
            title: fullTitle,
            url: resumeUrl,
        };

        const resume: ResumeEntity = await this.resumeRepository.createResume(
            newResumeDto,
            user.id,
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

    async deleteResume(user: User, resumeId: number): Promise<void> {
        await this.validateAuthor(user, resumeId);
        return this.resumeRepository.deleteResume(resumeId);
    }

    async updateResume(
        user: User,
        resumeId: number,
        updateResumeRequest: UpdateResumeRequest,
    ): Promise<GetResumeResponse> {
        await this.validateAuthor(user, resumeId);
        const resume: ResumeEntity = await this.resumeRepository.updateResume(
            resumeId,
            updateResumeRequest,
        );
        return new GetResumeResponse(resume);
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
}
