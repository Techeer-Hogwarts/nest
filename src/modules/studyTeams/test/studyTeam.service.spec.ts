import { Test, TestingModule } from '@nestjs/testing';
import { StudyTeamService } from '../studyTeam.service';
import { StudyTeamRepository } from '../repository/studyTeam.repository';
import { AwsService } from '../../awsS3/aws.service';
import { StudyMemberRepository } from '../../studyMembers/repository/studyMember.repository';
import { DuplicateStudyTeamNameException } from '../../../global/exception/custom.exception';
import {
    mockCreateStudyTeamRequest,
    mockUpdateStudyTeamRequest,
} from './mock-data';
import { CustomWinstonLogger } from '../../../global/logger/winston.logger';

describe('StudyTeamService', () => {
    let service: StudyTeamService;
    let studyTeamRepository: jest.Mocked<StudyTeamRepository>;
    let studyMemberRepository: jest.Mocked<StudyMemberRepository>;
    let awsService: jest.Mocked<AwsService>;
    let logger: CustomWinstonLogger;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                StudyTeamService,
                {
                    provide: StudyTeamRepository,
                    useValue: {
                        isUserMemberOfStudy: jest.fn(),
                        findStudyByName: jest.fn(),
                        checkExistUsers: jest.fn(),
                        createStudyTeam: jest.fn(),
                        updateStudyTeam: jest.fn(),
                        deleteStudyTeam: jest.fn(),
                        getUserStudyTeams: jest.fn(),
                        getStudyTeamById: jest.fn(),
                        getStudyTeamMembersById: jest.fn(),
                        closeStudyTeam: jest.fn(),
                        deleteImages: jest.fn(),
                        deleteMembers: jest.fn(),
                    },
                },
                {
                    provide: CustomWinstonLogger,
                    useValue: {
                        debug: jest.fn(),
                        error: jest.fn(),
                    },
                },
                {
                    provide: StudyMemberRepository,
                    useValue: {
                        getApplicants: jest.fn(),
                        isUserAlreadyInStudy: jest.fn(),
                        applyToStudyTeam: jest.fn(),
                        cancelApplication: jest.fn(),
                        getApplicantStatus: jest.fn(),
                        updateApplicantStatus: jest.fn(),
                        addMemberToStudyTeam: jest.fn(),
                        isUserMemberOfStudy: jest.fn(),
                    },
                },
                {
                    provide: AwsService,
                    useValue: { imageUploadToS3: jest.fn() },
                },
            ],
        }).compile();

        service = module.get<StudyTeamService>(StudyTeamService);
        studyTeamRepository = module.get(StudyTeamRepository);
        studyMemberRepository = module.get(StudyMemberRepository);
        awsService = module.get(AwsService);
        logger = module.get<CustomWinstonLogger>(CustomWinstonLogger);
    });

    describe('createStudyTeam', () => {
        it('should throw DuplicateStudyTeamNameException if study name already exists', async () => {
            // findStudyByName가 값(true 혹은 객체)을 반환하면 중복으로 간주함
            (
                studyTeamRepository.findStudyByName as jest.Mock
            ).mockResolvedValue(true);

            // 메서드 호출 시 DuplicateStudyTeamNameException 예외 발생 확인
            await expect(
                service.createStudyTeam(mockCreateStudyTeamRequest, []),
            ).rejects.toThrow(DuplicateStudyTeamNameException);

            // 내부에서 로깅이 제대로 수행되었는지 검증
            expect(logger.debug).toHaveBeenCalledWith(
                `Duplicate study team found for name: ${mockCreateStudyTeamRequest.name}`,
            );
        });
    });

    describe('updateStudyTeam', () => {
        it('should call repository to update the study team', async () => {
            const mockUpdatedStudyTeam = {
                id: 1,
                name: 'Updated Study',
                notionLink: 'https://notion.so/test-updated',
                recruitExplain: 'updated test',
                recruitNum: 6,
                rule: 'updated rule',
                goal: 'updated goal',
                studyExplain: 'updated explain',
                isRecruited: false,
                isFinished: false,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            };

            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyTeamRepository.updateStudyTeam.mockResolvedValue(
                mockUpdatedStudyTeam,
            );

            await service.updateStudyTeam(1, 1, mockUpdateStudyTeamRequest, []);
            expect(studyTeamRepository.updateStudyTeam).toHaveBeenCalled();
        });
    });

    describe('closeStudyTeam', () => {
        it('should call repository to close the study team', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyTeamRepository.getStudyTeamById.mockResolvedValue({
                id: 1,
                name: 'Test Study',
                notionLink: 'https://notion.so/test',
                recruitExplain: 'test',
                recruitNum: 5,
                rule: 'test rule',
                goal: 'test goal',
                studyExplain: 'test explain',
                isRecruited: false,
                isFinished: false,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            });
            studyTeamRepository.closeStudyTeam.mockResolvedValue({
                id: 1,
                name: 'Test Study',
                notionLink: 'https://notion.so/test',
                recruitExplain: 'test',
                recruitNum: 5,
                rule: 'test rule',
                goal: 'test goal',
                studyExplain: 'test explain',
                isRecruited: true,
                isFinished: false,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            });

            await service.closeStudyTeam(1, 1);
            expect(studyTeamRepository.closeStudyTeam).toHaveBeenCalled();
        });
    });

    describe('deleteStudyTeam', () => {
        it('should call repository to delete the study team', async () => {
            const mockDeletedStudyTeam = {
                id: 1,
                name: 'Deleted Study',
                notionLink: 'https://notion.so/test',
                recruitExplain: 'test',
                recruitNum: 5,
                rule: 'test rule',
                goal: 'test goal',
                studyExplain: 'test explain',
                isRecruited: false,
                isFinished: false,
                isDeleted: true,
                resultImages: [],
                studyMember: [],
                likeCount: 0,
                viewCount: 0,
            };

            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyTeamRepository.deleteStudyTeam.mockResolvedValue(
                mockDeletedStudyTeam,
            );

            await service.deleteStudyTeam(1, 1);
            expect(studyTeamRepository.deleteStudyTeam).toHaveBeenCalled();
        });
    });

    describe('getApplicants', () => {
        it('should call repository to get applicants', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyMemberRepository.getApplicants.mockResolvedValue([]);

            await service.getApplicants(1, 1);
            expect(studyMemberRepository.getApplicants).toHaveBeenCalled();
        });
    });

    describe('uploadImagesToS3', () => {
        it('should upload images to S3 and return URLs', async () => {
            const files = [{ originalname: 'test.jpg' } as Express.Multer.File];
            awsService.imageUploadToS3.mockResolvedValue(
                'https://s3-url.com/test.jpg',
            );

            const result = await service.uploadImagesToS3(files, 'study-teams');

            expect(result).toEqual(['https://s3-url.com/test.jpg']);
            expect(awsService.imageUploadToS3).toHaveBeenCalled();
        });
    });

    describe('cancelApplication', () => {
        it('should call repository to cancel application', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyMemberRepository.cancelApplication.mockResolvedValue({});

            await service.cancelApplication(1, 1);

            expect(studyMemberRepository.cancelApplication).toHaveBeenCalled();
        });
    });

    describe('addMemberToStudyTeam', () => {
        it('should add a new member to the study team', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyMemberRepository.addMemberToStudyTeam.mockResolvedValue({});
            studyMemberRepository.isUserMemberOfStudy.mockResolvedValue(false);

            await service.addMemberToStudyTeam(1, 1, 2, true);

            expect(
                studyMemberRepository.addMemberToStudyTeam,
            ).toHaveBeenCalled();
        });
    });
});
