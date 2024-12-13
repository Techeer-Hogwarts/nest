import { ProjectTeamEntity } from '../entities/projectTeam.entity';
import { CreateProjectTeamRequest } from '../dto/request/create.projectTeam.request';
import { GetProjectTeamResponse } from '../dto/response/get.projectTeam.response';
import { PaginationQueryDto } from '../../../global/common/pagination.query.dto';
import { TeamStackEntity } from '../../teamStacks/entities/teamStack.entity';
import { ProjectMemberEntity } from '../../projectMembers/entities/projectMember.entity';

export const mockCreateProjectTeamRequest: CreateProjectTeamRequest = {
    name: 'Test Team',
    projectExplain: 'This is a test project team.',
    frontendNum: 2,
    backendNum: 3,
    devopsNum: 1,
    uiuxNum: 1,
    dataEngineerNum: 1,
    recruitExplain: 'Looking for passionate developers!',
    isRecruited: true,
    isFinished: false,
    githubLink: 'https://github.com/test',
    notionLink: 'https://notion.so/test',
    stacks: [1, 2, 3],
};

//unknown 부분 수정할 예정 - 개발 급해서요.,..,,
export const mockTeamEntity = (
    overrides?: Partial<ProjectTeamEntity>,
): ProjectTeamEntity => {
    return {
        id: 1,
        name: 'Test Team',
        githubLink: 'https://github.com/example',
        notionLink: 'https://notion.so/example',
        projectExplain: 'This is a test project.',
        frontendNum: 3,
        backendNum: 2,
        devopsNum: 1,
        uiuxNum: 1,
        dataenginnerNum: 1, // Ensure this matches the entity's field name
        recruitExplain: 'Looking for developers',
        isRecruited: true,
        isFinished: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        teamStacks: [
            {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                projectTeamId: 1,
                stackId: 1,
                isMain: true,
                team: {
                    id: 1,
                    name: 'Test Team',
                    githubLink: 'https://github.com/example',
                    notionLink: 'https://notion.so/example',
                    projectExplain: 'This is a test project.',
                    frontendNum: 3,
                    backendNum: 2,
                    devopsNum: 1,
                    uiuxNum: 1,
                    dataenginnerNum: 1,
                    recruitExplain: 'Looking for developers',
                    isRecruited: true,
                    isFinished: false,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    teamStacks: [], // Empty arrays to satisfy type requirements
                    projectMembers: [],
                },
                stack: {
                    id: 1,
                    name: 'JavaScript',
                    category: 'Backend',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                },
            } as unknown as TeamStackEntity,
        ],
        projectMembers: [
            {
                id: 1,
                teamId: 1,
                userId: 1,
                isLeader: true,
                isDeleted: false,
                teamRole: 'Developer',
                projectTeamId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 1,
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    nickname: 'johnny',
                    year: 2023,
                    password: 'hashed_password',
                    isLft: false,
                    githubUrl: 'https://github.com/johndoe',
                    blogUrl: 'https://blog.johndoe.com',
                    roleId: 1,
                    // Add any additional fields required by the User entity
                },
            } as unknown as ProjectMemberEntity,
        ],
        stacks: [
            {
                id: 1,
                name: 'JavaScript',
                category: 'Backend',
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
            },
        ],
        ...overrides,
    };
};

export const mockTeamEntities: ProjectTeamEntity[] = [
    mockTeamEntity({ id: 1 }),
    mockTeamEntity({
        id: 2,
        name: 'Another Test Team',
    }),
];

export const mockGetTeamResponseList: GetProjectTeamResponse[] =
    mockTeamEntities.map(
        (team: ProjectTeamEntity) =>
            new GetProjectTeamResponse({
                id: team.id,
                name: team.name,
                projectExplain: team.projectExplain,
                frontendNum: team.frontendNum,
                backendNum: team.backendNum,
                devopsNum: team.devopsNum,
                uiuxNum: team.uiuxNum,
                dataenginnerNum: team.dataenginnerNum,
                recruitExplain: team.recruitExplain,
                isRecruited: team.isRecruited,
                isFinished: team.isFinished,
                createdAt: team.createdAt,
                updatedAt: team.updatedAt,
                isDeleted: team.isDeleted,
                githubLink: team.githubLink,
                notionLink: team.notionLink,
                teamStacks: team.teamStacks,
                stacks: team.stacks.map((stack) => ({
                    id: stack.id,
                    name: stack.name,
                    category: stack.category,
                    createdAt: stack.createdAt,
                    updatedAt: stack.updatedAt,
                    isDeleted: stack.isDeleted,
                })),
                projectMembers: team.projectMembers.map((member) => ({
                    id: member.id,
                    name: member.user.name,
                    teamRole: member.teamRole,
                    isLeader: member.isLeader,
                    createdAt: member.createdAt,
                    updatedAt: member.updatedAt,
                    isDeleted: member.isDeleted,
                    projectTeamId: member.projectTeamId,
                    userId: member.userId,
                    user: member.user,
                })),
            }),
    );

export const mockPaginationQueryDto: PaginationQueryDto = {
    offset: 0,
    limit: 10,
};

export const mockProjectData: ProjectTeamEntity[] = [
    mockTeamEntity({
        id: 3,
        name: 'Project A',
        projectExplain: 'Description of Project A.',
        frontendNum: 3,
        backendNum: 2,
        devopsNum: 1,
        uiuxNum: 1,
        dataenginnerNum: 1, // Ensure this matches the entity's field name
        isRecruited: true,
        isFinished: false,
        githubLink: 'https://github.com/projectA',
        notionLink: 'https://notion.so/projectA',
        recruitExplain: 'Looking for team members',
        teamStacks: [
            {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                projectTeamId: 3,
                stackId: 1,
                isMain: true,
                stack: {
                    id: 1,
                    name: 'JavaScript',
                    category: 'Backend',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                },
                team: null, // If unused, set as null
            } as unknown as TeamStackEntity,
        ],
        projectMembers: [
            {
                id: 1,
                teamId: 3,
                userId: 1,
                isLeader: true,
                isDeleted: false,
                teamRole: 'Developer',
                projectTeamId: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
                user: {
                    id: 1,
                    name: 'John Doe',
                    email: 'john.doe@example.com',
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    isDeleted: false,
                    nickname: 'johnny',
                    year: 2023,
                    password: 'hashed_password',
                    isLft: false,
                    githubUrl: 'https://github.com/johndoe',
                    blogUrl: 'https://blog.johndoe.com',
                    roleId: 1,
                },
            } as unknown as ProjectMemberEntity,
        ],
    }),
];
