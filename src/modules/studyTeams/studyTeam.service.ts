import { Injectable, UseInterceptors } from "@nestjs/common";
import { StudyTeamRepository } from "./repository/studyTeam.repository";
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { AwsService } from "src/awsS3/aws.service";
import { FileInterceptor } from '@nestjs/platform-express';

@Injectable()
export class StudyTeamService {
    constructor(
        private readonly studyTeamRepository: StudyTeamRepository,
        private readonly awsService: AwsService
    ) {}


    // 공고 올리는 것도 팀원들도 다 할 수 있음 (그대신 누가 리더인지 제대로 지정해야함)
    @UseInterceptors(FileInterceptor('file'))
    async createStudyTeam(createStudyTeamRequest: CreateStudyTeamRequest & { file: Express.Multer.File }): Promise<any> {
        if (createStudyTeamRequest.file) {
            const ext = createStudyTeamRequest.file.originalname.split('.').pop();
            const imageUrl = await this.awsService.imageUploadToS3('study-teams', `study-team-${Date.now()}.${ext}`, createStudyTeamRequest.file, ext);
            createStudyTeamRequest.resultImages = [imageUrl];
        }

        const studyData = await this.studyTeamRepository.createStudyTeam(createStudyTeamRequest);
        return studyData;
    }
} 
