import { Injectable, Logger } from "@nestjs/common";
import { StudyTeamRepository } from "./repository/studyTeam.repository";
import { CreateStudyTeamRequest } from './dto/request/create.studyTeam.request';
import { AwsService } from "src/awsS3/aws.service";
import { NotFoundUserException, UploadStudyTeamException, UpdateStudyTeamException, NotFoundStudyTeamException, NotStudyMemberException } from "src/global/exception/custom.exception";
import { UpdateStudyTeamRequest } from "./dto/request/update.studyTeam.request";

@Injectable()
export class StudyTeamService {
    private readonly logger = new Logger(StudyTeamService.name);

    constructor(
        private readonly studyTeamRepository: StudyTeamRepository,
        private readonly awsService: AwsService
    ) {}

    async ensureUserIsStudyMember(studyId: number, userId: number): Promise<void> {
        const isMember = await this.studyTeamRepository.isUserMemberOfStudy(studyId, userId);
        if (!isMember) {
            throw new NotStudyMemberException();
        }
    }

    async uploadImagesToS3(files: Express.Multer.File[], folder: string): Promise<string[]> {
        try {
            this.logger.debug(`📂 [INFO] 총 ${files.length}개의 파일 업로드 중...`);
            const imageUrls = await Promise.all(files.map(async (file, index) => {
                const ext = file.originalname.split('.').pop();
                this.logger.debug(`📂 [INFO] [${index + 1}] 파일명: ${file.originalname} | 확장자: ${ext}`);
                
                const imageUrl = await this.awsService.imageUploadToS3(
                    folder, 
                    `study-team-${Date.now()}-${index}.${ext}`, 
                    file, 
                    ext
                );
                
                this.logger.debug(`🌐 [INFO] [${index + 1}] S3 업로드 성공 - URL: ${imageUrl}`);
                return imageUrl;
            }));
            return imageUrls;
        } catch (error) {
            this.logger.error('❌ [ERROR] uploadImagesToS3 에서 예외 발생: ', error);
            throw new Error('S3 이미지 업로드 중 오류가 발생했습니다.');
        }
    }

    async createStudyTeam(createStudyTeamRequest: CreateStudyTeamRequest, files: Express.Multer.File[]): Promise<any> {
        try {
            this.logger.debug('🔥 [START] createStudyTeam 요청 시작');
    
            if (files && files.length > 0) {
                this.logger.debug(`📂 [INFO] 총 ${files.length}개의 파일이 업로드 대기 중입니다.`);
                const imageUrls = await this.uploadImagesToS3(files, 'study-teams');
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

    async updateStudyTeam(id: number, userId: number, updateStudyTeamDto: UpdateStudyTeamRequest, files: Express.Multer.File[]): Promise<any> {
        try {
            this.logger.debug('🔥 [START] updateStudyTeam 요청 시작');

            await this.ensureUserIsStudyMember(id, userId); 
            
            // 파일 업로드
            let imageUrls: string[] = [];
            if (files && files.length > 0) {
                imageUrls = await this.uploadImagesToS3(files, 'study-teams');
                updateStudyTeamDto.resultImages = imageUrls;
            }
            
            // 이미지 삭제 요청 처리
            if (updateStudyTeamDto.deleteImages && updateStudyTeamDto.deleteImages.length > 0) {
                await this.studyTeamRepository.deleteImages(updateStudyTeamDto.deleteImages);
            }
            
            // 스터디 멤버 삭제 요청 처리
            if (updateStudyTeamDto.deleteMembers && updateStudyTeamDto.deleteMembers.length > 0) {
                await this.studyTeamRepository.deleteMembers(updateStudyTeamDto.deleteMembers);
            }
            
            // 업데이트할 데이터 추출
            const updateData = { ...updateStudyTeamDto };
            delete updateData.deleteImages;
            delete updateData.deleteMembers;
            delete updateData.resultImages;
            
            const studyData = await this.studyTeamRepository.updateStudyTeam(id, updateData, updateStudyTeamDto.resultImages, updateStudyTeamDto.studyMember);
            
            return studyData;
        } catch (error) {
            this.logger.error('❌ [ERROR] updateStudyTeam 에서 예외 발생: ', error);
            throw new UpdateStudyTeamException();
        }
    }

    async closeStudyTeam(id: number, userId: number): Promise<any> {
        try {
            await this.ensureUserIsStudyMember(id, userId);
            const updatedStudyTeam = await this.studyTeamRepository.closeStudyTeam(id);
            this.logger.debug('✅ [SUCCESS] 스터디 팀 모집 마감 성공');
            return updatedStudyTeam;
        } catch (error) {
            this.logger.error('❌ [ERROR] closeStudyTeam 에서 예외 발생: ', error);
            throw error;
        }
    }

    async deleteStudyTeam(id: number, userId: number): Promise<any> {
        try {
            await this.ensureUserIsStudyMember(id, userId);
            const updatedStudyTeam = await this.studyTeamRepository.deleteStudyTeam(id);
            this.logger.debug('✅ [SUCCESS] 스터디 팀 삭제 성공');
            return updatedStudyTeam;
        } catch (error) {
            this.logger.error('❌ [ERROR] deleteStudyTeam 에서 예외 발생: ', error);
            throw error;
        }
    }

    async getUserStudyTeams(userId: number): Promise<any> {
        try {
            const studyData = await this.studyTeamRepository.getUserStudyTeams(userId);
            this.logger.debug('✅ [SUCCESS] 유저 참여 스터디 목록 조회 성공');
            return studyData;
        } catch (error) {
            this.logger.error('❌ [ERROR] getUserStudyTeams 에서 예외 발생: ', error);
            throw error;
        }
    }

    async getStudyTeamById(id: number): Promise<any> {
        try {
            const studyData = await this.studyTeamRepository.getStudyTeamById(id);
            
            if (!studyData) {
                throw new NotFoundStudyTeamException();
            }

            this.logger.debug('✅ [SUCCESS] 스터디 상세 조회 성공');
            return studyData;
        } catch (error) {
            this.logger.error('❌ [ERROR] getStudyTeamById 에서 예외 발생: ', error);
            throw error;
        }
    }

    async getStudyTeamMembersById(id: number): Promise<any> {
        try {
            const studyData = await this.studyTeamRepository.getStudyTeamMembersById(id);
            
            if (!studyData) {
                throw new NotFoundStudyTeamException();
            }

            this.logger.debug('✅ [SUCCESS] 특정 스터디의 모든 인원 조회 성공');
            return studyData;
        } catch (error) {
            this.logger.error('❌ [ERROR] getStudyTeamMembersById 에서 예외 발생: ', error);
            throw error;
        }
    }
} 
