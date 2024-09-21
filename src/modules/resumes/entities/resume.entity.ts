import { Resume, ResumeType } from '@prisma/client';
import { UserEntity } from 'src/modules/users/entities/user.entity';

export class ResumeEntity implements Resume {
    id: number;
    createdAt: Date;
    updatedAt: Date;
    isDeleted: boolean;
    userId: number;
    title: string;
    url: string;
    isMain: boolean;
    likeCount: number;
    viewCount: number;
    ResumeType: ResumeType;

    user: UserEntity;
}
