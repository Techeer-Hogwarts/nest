import { PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: {
            name: 'admin',
        },
    });

    const mentorRole = await prisma.role.upsert({
        where: { name: 'mentor' },
        update: {},
        create: {
            name: 'mentor',
            parent: { connect: { id: adminRole.id } }, // admin과 연결
        },
    });

    const userRole = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
            parent: { connect: { id: mentorRole.id } }, // mentor와 연결
        },
    });

    Logger.log('Roles have been seeded:', {
        adminRole,
        mentorRole,
        userRole,
    });
}

main()
    .catch((e) => {
        Logger.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });