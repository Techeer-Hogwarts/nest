import { Test, TestingModule } from '@nestjs/testing';
import { StudyTeamService } from '../studyTeam.service';
import { StudyTeamRepository } from '../repository/studyTeam.repository';
import { AwsService } from '../../../awsS3/aws.service';
import { StudyMemberRepository } from '../../studyMembers/repository/studyMember.repository';
import {
    NotStudyMemberException,
    DuplicateStudyTeamNameException,
} from '../../../global/exception/custom.exception';
import {
    mockCreateStudyTeamRequest,
    mockUpdateStudyTeamRequest,
} from './mock-data';

describe('StudyTeamService', () => {
    let service: StudyTeamService;
    let studyTeamRepository: jest.Mocked<StudyTeamRepository>;
    let studyMemberRepository: jest.Mocked<StudyMemberRepository>;
    let awsService: jest.Mocked<AwsService>;

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
    });

    describe('createStudyTeam', () => {
        it('should throw DuplicateStudyTeamNameException if study name already exists', async () => {
            studyTeamRepository.findStudyByName.mockResolvedValue(true);

            await expect(
                service.createStudyTeam(mockCreateStudyTeamRequest, []),
            ).rejects.toThrow(DuplicateStudyTeamNameException);
        });
    });

    describe('updateStudyTeam', () => {
        it('should call repository to update the study team', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyTeamRepository.updateStudyTeam.mockResolvedValue({});

            const result = await service.updateStudyTeam(
                1,
                1,
                mockUpdateStudyTeamRequest,
                [],
            );
            expect(studyTeamRepository.updateStudyTeam).toHaveBeenCalled();
        });
    });

    describe('closeStudyTeam', () => {
        it('should call repository to close the study team', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyTeamRepository.getStudyTeamById.mockResolvedValue({
                status: 'OPEN',
            });
            studyTeamRepository.closeStudyTeam.mockResolvedValue({});

            const result = await service.closeStudyTeam(1, 1);
            expect(studyTeamRepository.closeStudyTeam).toHaveBeenCalled();
        });
    });

    describe('deleteStudyTeam', () => {
        it('should call repository to delete the study team', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyTeamRepository.deleteStudyTeam.mockResolvedValue({});

            const result = await service.deleteStudyTeam(1, 1);
            expect(studyTeamRepository.deleteStudyTeam).toHaveBeenCalled();
        });
    });

    describe('getApplicants', () => {
        it('should call repository to get applicants', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyMemberRepository.getApplicants.mockResolvedValue([]);

            const result = await service.getApplicants(1, 1);
            expect(studyMemberRepository.getApplicants).toHaveBeenCalled();
        });
    });

    describe('ensureUserIsStudyMember', () => {
        it('should throw NotStudyMemberException if user is not a member', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(false);

            await expect(service.ensureUserIsStudyMember(1, 1)).rejects.toThrow(
                NotStudyMemberException,
            );
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

            const result = await service.cancelApplication(1, 1);

            expect(studyMemberRepository.cancelApplication).toHaveBeenCalled();
        });
    });

    describe('addMemberToStudyTeam', () => {
        it('should add a new member to the study team', async () => {
            studyTeamRepository.isUserMemberOfStudy.mockResolvedValue(true);
            studyMemberRepository.addMemberToStudyTeam.mockResolvedValue({});
            studyMemberRepository.isUserMemberOfStudy.mockResolvedValue(false);

            const result = await service.addMemberToStudyTeam(1, 1, 2, true);

            expect(
                studyMemberRepository.addMemberToStudyTeam,
            ).toHaveBeenCalled();
        });
    });
});
