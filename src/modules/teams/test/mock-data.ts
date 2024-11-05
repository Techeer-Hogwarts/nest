import { TeamEntity } from '../entities/team.entity';
import { CreateAnnouncementRequest } from '../dto/request/create.team.request';
import { GetTeamResponse } from '../dto/response/get.team.response';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';
import { StackEntity } from '../../stacks/entities/stack.entity';
import { TeamStackEntity } from '../../teamStacks/entities/teamStack.entity';
// import { TeamMemberEntity } from '../../teamMembers/domain/teamMember.entity';

export const mockCreateAnnouncementRequest: CreateAnnouncementRequest = {
    name: 'Test Team',
    category: 'Test Category',
    isRecruited: true,
    isFinished: false,
    stacks: [1, 2, 3],
};

export const mockTeamEntity = (overrides?: Partial<TeamEntity>): TeamEntity => {
    const team = new TeamEntity({
        id: 1,
        name: 'Test Team',
        category: 'Test Category',
        isRecruited: true,
        isFinished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        teamStacks: [],
        teamMembers: [],
        stacks: [],
    });

    const stack = new StackEntity();
    stack.id = 1;
    stack.name = 'JavaScript';
    stack.category = 'BACKEND';
    stack.createdAt = new Date();
    stack.updatedAt = new Date();
    stack.isDeleted = false;

    const teamStack = new TeamStackEntity();
    teamStack.id = 1;
    teamStack.createdAt = new Date();
    teamStack.updatedAt = new Date();
    teamStack.isDeleted = false;
    teamStack.stackId = 1;
    teamStack.teamId = 1;
    teamStack.isMain = true;
    teamStack.stack = stack;

    // const teamMember = new TeamMemberEntity({
    //     id: 1,
    //     createdAt: new Date(),
    //     updatedAt: new Date(),
    //     isDeleted: false,
    //     isLeader: true,
    //     teamRole: 'Backend Developer',
    //     teamId: 1,
    //     userId: 1,
    //     user: {
    //         id: 1,
    //         name: 'User A',
    //         email: 'user@example.com',
    //         createdAt: new Date(),
    //         updatedAt: new Date(),
    //         year: 3,
    //         password: 'password',
    //         isLft: false,
    //         githubUrl: 'https://github.com/user',
    //         blogUrl: 'https://blog.com/user',
    //         mainPosition: 'Backend Developer',
    //         roleId: 1,
    //         isDeleted: false,
    //         subPosition: '',
    //         school: '한국공학대학교',
    //         class: '3',
    //         isAuth: false,
    //     },
    // });

    team.teamStacks = [teamStack as TeamStackEntity];

    team.teamMembers = [];

    Object.assign(team, overrides);

    return team;
};

// 여러 TeamEntity 인스턴스를 포함한 mockTeamEntities 배열
export const mockTeamEntities: TeamEntity[] = [
    mockTeamEntity({ id: 1 }),
    mockTeamEntity({
        id: 2,
        name: 'Another Test Team',
    }),
];

// GetTeamResponse 구조에 맞춘 mockGetTeamResponseList 배열
export const mockGetTeamResponseList: GetTeamResponse[] = mockTeamEntities.map(
    (team: TeamEntity) =>
        new GetTeamResponse({
            id: team.id,
            name: team.name,
            category: team.category,
            isRecruited: team.isRecruited,
            isFinished: team.isFinished,
            createdAt: team.createdAt,
            updatedAt: team.updatedAt,
            isDeleted: team.isDeleted,
            teamStacks: team.teamStacks,
            stacks: team.stacks.map((stack) => ({
                id: stack.id,
                name: stack.name,
                category: stack.category,
                createdAt: stack.createdAt,
                updatedAt: stack.updatedAt,
                isDeleted: stack.isDeleted,
            })),
            teamMembers: team.teamMembers.map((member) => ({
                id: member.user.id,
                name: member.user.name,
                teamRole: member.teamRole,
                isLeader: member.isLeader,
                createdAt: member.createdAt,
                updatedAt: member.updatedAt,
                isDeleted: member.isDeleted,
                teamId: member.teamId,
                userId: member.userId,
                user: member.user,
            })),
        }),
);

// 페이지네이션 테스트용 mockPaginationQueryDto
export const mockPaginationQueryDto: PaginationQueryDto = {
    offset: 0,
    limit: 10,
};

// TeamEntity 구조를 사용한 프로젝트 데이터 mockProjectData 배열
export const mockProjectData: TeamEntity[] = [
    mockTeamEntity({
        id: 3,
        name: 'Project A',
        category: 'Category A',
        isRecruited: true,
        isFinished: false,
    }),
    mockTeamEntity({
        id: 4,
        name: 'Project B',
        category: 'Category B',
        isRecruited: false,
        isFinished: true,
    }),
];
