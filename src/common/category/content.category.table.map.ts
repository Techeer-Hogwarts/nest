import { ContentCategory } from './content.category';
import { PrismaService } from '../../infra/prisma/prisma.service';

type ContentTableMap = Record<
    ContentCategory,
    { table: any; name: string; include?: Record<string, boolean> }
>;

export const CreateContentTableMap = (
    prisma: PrismaService,
): ContentTableMap => ({
    [ContentCategory.SESSION]: {
        table: prisma.session,
        name: 'Session',
        include: { user: true },
    },
    [ContentCategory.BLOG]: {
        table: prisma.blog,
        name: 'Blog',
        include: { user: true },
    },
    [ContentCategory.RESUME]: {
        table: prisma.resume,
        name: 'Resume',
        include: { user: true },
    },
    [ContentCategory.PROJECT]: {
        table: prisma.projectTeam,
        name: 'ProjectTeam',
        include: {
            resultImages: true,
            teamStacks: true,
        },
    },
    [ContentCategory.STUDY]: {
        table: prisma.studyTeam,
        name: 'StudyTeam',
        include: { resultImages: true },
    },
});
