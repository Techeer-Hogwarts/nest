import { Injectable, NotFoundException } from '@nestjs/common';
import { ResumeRepository } from './repository/resume.repository';
import { CreateResumeRequest } from './dto/request/create.resume.request';
import { GetResumeResponse } from './dto/response/get.resume.response';
import { ResumeEntity } from './entities/resume.entity';
import { GetResumesQueryRequest } from './dto/request/get.resumes.query.request';
import { PaginationQueryDto } from '../../global/common/pagination.query.dto';
import { UpdateResumeRequest } from './dto/request/update.resume.request';

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
        userId: number,
    ): Promise<GetResumeResponse> {
        const resume: ResumeEntity = await this.resumeRepository.createResume(
            createResumeRequest,
            userId,
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
            throw new NotFoundException('이력서를 찾을 수 없습니다.');
        }
        return new GetResumeResponse(resume);
    }

    async getResumesByUser(
        userId: number,
        query: PaginationQueryDto,
    ): Promise<GetResumeResponse[]> {
        // todo: 유저가 존재하는지 검사
        const resumes: ResumeEntity[] =
            await this.resumeRepository.getResumesByUser(userId, query);
        return resumes.map(
            (resume: ResumeEntity) => new GetResumeResponse(resume),
        );
    }

    async deleteResume(resumeId: number): Promise<void> {
        await this.resumeRepository.getResume(resumeId); // 이력서 존재 여부 검사
        return this.resumeRepository.deleteResume(resumeId);
    }

    async updateResume(
        resumeId: number,
        updateResumeRequest: UpdateResumeRequest,
    ): Promise<GetResumeResponse> {
        await this.resumeRepository.getResume(resumeId); // 이력서 존재 여부 검사
        const resume: ResumeEntity = await this.resumeRepository.updateResume(
            resumeId,
            updateResumeRequest,
        );
        return new GetResumeResponse(resume);
    }
}
