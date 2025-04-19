import type { ColumnType } from 'kysely';
export type Generated<T> =
    T extends ColumnType<infer S, infer I, infer U>
        ? ColumnType<S, I | undefined, U>
        : ColumnType<T, T | undefined, T>;
export type Timestamp = ColumnType<Date, Date | string, Date | string>;

import type { StatusCategory, StackCategory } from './enums';

export type Blog = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    userId: number;
    title: string;
    url: string;
    date: Timestamp;
    author: string | null;
    authorImage: string | null;
    category: string;
    thumbnail: string | null;
    tags: Generated<string[]>;
    likeCount: Generated<number>;
    viewCount: Generated<number>;
};
export type Bookmark = {
    id: Generated<number>;
    userId: number;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    contentId: number;
    category: string;
};
export type Event = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    category: string;
    title: string;
    startDate: Timestamp;
    endDate: Timestamp | null;
    url: string | null;
    userId: number;
};
export type Like = {
    id: Generated<number>;
    userId: number;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    contentId: number;
    category: string;
};
export type PermissionRequest = {
    id: Generated<number>;
    userId: number;
    requestedRoleId: number;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    status: Generated<StatusCategory>;
};
export type ProjectMainImage = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    imageUrl: string;
    projectTeamId: number;
};
export type ProjectMember = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    isLeader: boolean;
    teamRole: string;
    projectTeamId: number;
    userId: number;
    summary: string;
    status: StatusCategory;
};
export type ProjectResultImage = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    imageUrl: string;
    projectTeamId: number;
};
export type ProjectTeam = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    isRecruited: Generated<boolean>;
    isFinished: Generated<boolean>;
    name: string;
    githubLink: string;
    notionLink: string;
    projectExplain: string;
    frontendNum: number;
    backendNum: number;
    devopsNum: number;
    fullStackNum: number;
    dataEngineerNum: number;
    recruitExplain: string;
    likeCount: Generated<number>;
    viewCount: Generated<number>;
};
export type Resume = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    userId: number;
    title: string;
    url: string;
    isMain: Generated<boolean>;
    category: string;
    position: string;
    likeCount: Generated<number>;
    viewCount: Generated<number>;
};
export type Role = {
    id: Generated<number>;
    name: string;
    parentId: number | null;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
};
export type Session = {
    id: Generated<number>;
    userId: number;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    title: string;
    likeCount: Generated<number>;
    viewCount: Generated<number>;
    thumbnail: string;
    videoUrl: string | null;
    fileUrl: string | null;
    presenter: string;
    date: string;
    category: string;
    position: string;
};
export type Stack = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    name: string;
    category: StackCategory;
};
export type StudyMember = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    isLeader: boolean;
    studyTeamId: number;
    userId: number;
    summary: string;
    status: StatusCategory;
};
export type StudyResultImage = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    imageUrl: string;
    studyTeamId: number;
};
export type StudyTeam = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    isRecruited: Generated<boolean>;
    isFinished: Generated<boolean>;
    name: string;
    githubLink: string;
    notionLink: string;
    studyExplain: string;
    goal: string;
    rule: string;
    recruitNum: number;
    recruitExplain: string;
    likeCount: Generated<number>;
    viewCount: Generated<number>;
};
export type SyncDb = {
    id: Generated<number>;
    lastSyncedAt: Generated<Timestamp>;
};
export type TeamStack = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    isMain: Generated<boolean>;
    stackId: number;
    projectTeamId: number;
};
export type User = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    name: string;
    email: string;
    nickname: string | null;
    year: number;
    password: string;
    isLft: Generated<boolean>;
    githubUrl: string;
    mainPosition: string;
    subPosition: string | null;
    school: string;
    profileImage: string;
    stack: Generated<string[]>;
    isAuth: Generated<boolean>;
    roleId: number;
    grade: string;
    mediumUrl: string | null;
    tistoryUrl: string | null;
    velogUrl: string | null;
};
export type UserExperience = {
    id: Generated<number>;
    createdAt: Generated<Timestamp>;
    updatedAt: Timestamp;
    isDeleted: Generated<boolean>;
    userId: number;
    position: string;
    companyName: string;
    startDate: Timestamp;
    endDate: Timestamp | null;
    category: string;
    isFinished: Generated<boolean>;
};
export type DB = {
    Blog: Blog;
    Bookmark: Bookmark;
    Event: Event;
    Like: Like;
    PermissionRequest: PermissionRequest;
    ProjectMainImage: ProjectMainImage;
    ProjectMember: ProjectMember;
    ProjectResultImage: ProjectResultImage;
    ProjectTeam: ProjectTeam;
    Resume: Resume;
    Role: Role;
    Session: Session;
    Stack: Stack;
    StudyMember: StudyMember;
    StudyResultImage: StudyResultImage;
    StudyTeam: StudyTeam;
    SyncDb: SyncDb;
    TeamStack: TeamStack;
    User: User;
    UserExperience: UserExperience;
};
