import { ContentCategory } from './contentCategory';
import { PrismaService } from '../../modules/prisma/prisma.service';

type ContentTableMap = Record<ContentCategory, { table: any; name: string }>;

export const CreateContentTableMap = (
    prisma: PrismaService,
): ContentTableMap => ({
    [ContentCategory.SESSION]: {
        table: prisma.session,
        name: 'Session',
    },
    [ContentCategory.BLOG]: {
        table: prisma.blog,
        name: 'Blog',
    },
    [ContentCategory.RESUME]: {
        table: prisma.resume,
        name: 'Resume',
    },
    [ContentCategory.PROJECT]: {
        table: prisma.projectTeam,
        name: 'ProjectTeam',
    },
    [ContentCategory.STUDY]: {
        table: prisma.studyTeam,
        name: 'StudyTeam',
    },
});
