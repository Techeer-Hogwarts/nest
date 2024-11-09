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

    // 유저 목데이터
    await prisma.user.createMany({
        data: [
            {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                name: '테테',
                email: 'tete@example.com',
                nickname: 'tete',
                year: 2024,
                password: 'password123',
                isLft: false,
                githubUrl: 'https://github.com/tete',
                blogUrl: 'https://tete-blog.com',
                mainPosition: 'Backend Developer',
                subPosition: 'Frontend Developer',
                school: 'Tech University',
                class: 'A',
                profileImage: 'https://example.com/tete.png',
                stack: ['Node.js', 'TypeScript', 'NestJS'],
                isAuth: true,
                isIntern: false,
                internPosition: '',
                internCompanyName: '',
                internStartDate: null,
                internEndDate: null,
                isFullTime: false,
                fullTimeCompanyName: '',
                fullTimePosition: '',
                fullTimeStartDate: null,
                fullTimeEndDate: null,
                roleId: 1,
            },
            {
                id: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                name: '커커',
                email: 'keke@example.com',
                nickname: 'keke',
                year: 2024,
                password: 'password123',
                isLft: true,
                githubUrl: 'https://github.com/keke',
                blogUrl: 'https://keke-blog.com',
                mainPosition: 'Frontend Developer',
                subPosition: 'UI/UX Designer',
                school: 'Design Academy',
                class: 'B',
                profileImage: 'https://example.com/keke.png',
                stack: ['React', 'JavaScript', 'CSS'],
                isAuth: true,
                isIntern: true,
                internPosition: 'Frontend Intern',
                internCompanyName: 'DesignWorks',
                internStartDate: new Date('2023-01-01'),
                internEndDate: new Date('2023-06-01'),
                isFullTime: false,
                fullTimeCompanyName: '',
                fullTimePosition: '',
                fullTimeStartDate: null,
                fullTimeEndDate: null,
                roleId: 2,
            },
            {
                id: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                name: '집집',
                email: 'zipzip@example.com',
                nickname: 'zipzip',
                year: 2024,
                password: 'password123',
                isLft: false,
                githubUrl: 'https://github.com/zipzip',
                blogUrl: 'https://zipzip-blog.com',
                mainPosition: 'DevOps Engineer',
                subPosition: 'Backend Developer',
                school: 'Engineering School',
                class: 'C',
                profileImage: 'https://example.com/zipzip.png',
                stack: ['Docker', 'Kubernetes', 'AWS'],
                isAuth: true,
                isIntern: false,
                internPosition: '',
                internCompanyName: '',
                internStartDate: null,
                internEndDate: null,
                isFullTime: true,
                fullTimeCompanyName: 'CloudCorp',
                fullTimePosition: 'DevOps Engineer',
                fullTimeStartDate: new Date('2022-05-01'),
                fullTimeEndDate: null,
                roleId: 3,
            },
        ],
    });
    // 블로그 목데이터
    await prisma.blog.createMany({
        data: [
            {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                userId: 1,
                title: '테테의 첫 번째 블로그',
                url: 'https://tete-blog.com/first-post',
                date: new Date('2024-01-01'),
                category: 'Backend Development',
                likeCount: 10,
                viewCount: 100,
            },
            {
                id: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                userId: 2,
                title: '커커의 디자인 이야기',
                url: 'https://keke-blog.com/design-story',
                date: new Date('2024-02-01'),
                category: 'UI/UX Design',
                likeCount: 20,
                viewCount: 200,
            },
            {
                id: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                userId: 3,
                title: '집집의 DevOps 모험',
                url: 'https://zipzip-blog.com/devops-journey',
                date: new Date('2024-03-01'),
                category: 'DevOps',
                likeCount: 30,
                viewCount: 300,
            },
        ],
    });
    // 이력서 목데이터 삽입
    await prisma.resume.createMany({
        data: [
            {
                id: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                userId: 1,
                title: '테테의 이력서',
                url: 'https://tete-resume.com',
                isMain: true,
                likeCount: 15,
                viewCount: 150,
                category: 'PORTFOLIO',
            },
            {
                id: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                userId: 2,
                title: '커커의 이력서',
                url: 'https://keke-resume.com',
                isMain: false,
                likeCount: 25,
                viewCount: 250,
                category: 'ICT',
            },
            {
                id: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                userId: 3,
                title: '집집의 이력서',
                url: 'https://zipzip-resume.com',
                isMain: true,
                likeCount: 35,
                viewCount: 350,
                category: 'SOMA',
            },
        ],
    });
    // 세션 목데이터
    await prisma.session.createMany({
        data: [
            {
                id: 1,
                userId: 1,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                thumbnail: 'https://example.com/session1-thumbnail.png',
                title: '테테의 백엔드 세션',
                presenter: '테테',
                position: 'BACKEND',
                category: 'PARTNERS',
                date: 'WINTER_2023',
                videoUrl: 'https://example.com/session1-video',
                fileUrl: 'https://example.com/session1-file',
                likeCount: 50,
                viewCount: 500,
            },
            {
                id: 2,
                userId: 2,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                thumbnail: 'https://example.com/session2-thumbnail.png',
                title: '커커의 디자인 세션',
                presenter: '커커',
                position: 'FRONTEND',
                category: 'BOOTCAMP',
                date: 'SUMMER_2024',
                videoUrl: 'https://example.com/session2-video',
                fileUrl: 'https://example.com/session2-file',
                likeCount: 60,
                viewCount: 600,
            },
            {
                id: 3,
                userId: 3,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDeleted: false,
                thumbnail: 'https://example.com/session3-thumbnail.png',
                title: '집집의 DevOps 세션',
                presenter: '집집',
                position: 'BACKEND',
                category: 'BOOTCAMP',
                date: 'EIGHTH',
                videoUrl: 'https://example.com/session3-video',
                fileUrl: 'https://example.com/session3-file',
                likeCount: 70,
                viewCount: 700,
            },
        ],
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
