import { PrismaService } from '../../infra/prisma/prisma.service';
import { InteractableContentType } from './content.type.for.interaction';

type InteractableContentTableMap = {
    [K in InteractableContentType]: {
        table: any;
        name: string;
        include?: Record<string, boolean>;
    };
};

export const CreateInteractableContentTableMap = (
    prisma: PrismaService,
): InteractableContentTableMap => {
    return {
        SESSION: {
            table: prisma.session,
            name: 'Session',
            include: { user: true },
        },
        BLOG: {
            table: prisma.blog,
            name: 'Blog',
            include: { user: true },
        },
        RESUME: {
            table: prisma.resume,
            name: 'Resume',
            include: { user: true },
        },
        PROJECT: {
            table: prisma.projectTeam,
            name: 'ProjectTeam',
            include: {
                resultImages: true,
                teamStacks: true,
            },
        },
        STUDY: {
            table: prisma.studyTeam,
            name: 'StudyTeam',
            include: { resultImages: true },
        },
    } satisfies InteractableContentTableMap;
};
