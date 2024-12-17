import { Injectable, Logger } from "@nestjs/common";
import { StudyTeamRepository } from "./repository/studyTeam.repository";
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { AwsService } from "src/awsS3/aws.service";
import { NotFoundUserException, UploadStudyTeamException } from "src/global/exception/custom.exception";

@Injectable()
export class StudyTeamService {
    private readonly logger = new Logger(StudyTeamService.name);

    constructor(
        private readonly studyTeamRepository: StudyTeamRepository,
        private readonly awsService: AwsService
    ) {}

    async createStudyTeam(createStudyTeamRequest: CreateStudyTeamRequest, files: Express.Multer.File[]): Promise<any> {
        try {
            this.logger.debug('🔥 [START] createStudyTeam 요청 시작');
    
            if (files && files.length > 0) {
                this.logger.debug(`📂 [INFO] 총 ${files.length}개의 파일이 업로드 대기 중입니다.`);

                const imageUrls = await Promise.all(files.map(async (file, index) => {
                    const ext = file.originalname.split('.').pop();
                    this.logger.debug(`📂 [INFO] [${index + 1}] 파일명: ${file.originalname} | 확장자: ${ext}`);
                    
                    const imageUrl = await this.awsService.imageUploadToS3(
                        'study-teams', 
                        `study-team-${Date.now()}-${index}.${ext}`, 
                        file, 
                        ext
                    );
                    
                    this.logger.debug(`🌐 [INFO] [${index + 1}] S3 업로드 성공 - URL: ${imageUrl}`);
                    return imageUrl;
                }));
    
                createStudyTeamRequest.resultImages = imageUrls; 
            } else {
                this.logger.debug('⚠️ [WARNING] 파일이 존재하지 않습니다.');
                createStudyTeamRequest.resultImages = [];
            }
    
            const userIds = createStudyTeamRequest.studyMember.map(member => member.userId);
            const existingUserIds = await this.studyTeamRepository.checkExistUsers(userIds);
            
            const nonExistentUsers = userIds.filter(id => !existingUserIds.includes(id));
            if (nonExistentUsers.length > 0) {
                this.logger.error(`❌ [ERROR] 존재하지 않는 사용자 ID: ${nonExistentUsers}`);
                throw new NotFoundUserException();
            }
            
            this.logger.debug('📘 [INFO] createStudyTeamRequest 데이터: ' + JSON.stringify(createStudyTeamRequest));
    
            const studyData = await this.studyTeamRepository.createStudyTeam(createStudyTeamRequest);
            this.logger.debug('✅ [SUCCESS] StudyTeamRepository에 데이터 저장 성공');
    
            return studyData;
        } catch (error) {
            this.logger.error('❌ [ERROR] createStudyTeam 에서 예외 발생: ', error);
            throw new UploadStudyTeamException();
        }
    }
} 
