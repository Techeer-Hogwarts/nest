import { Test, TestingModule } from '@nestjs/testing';
import { ProjectMemberService } from './projectMember.service';

describe('ProjectMemberService', () => {
    let service: ProjectMemberService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [ProjectMemberService],
        }).compile();

        service = module.get<ProjectMemberService>(ProjectMemberService);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });
});
