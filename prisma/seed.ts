import { Prisma, PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    // Role 데이터 생성 (upsert 그대로)
    const adminRole = await prisma.role.upsert({
        where: { name: 'admin' },
        update: {},
        create: { name: 'admin' },
    });

    const mentorRole = await prisma.role.upsert({
        where: { name: 'mentor' },
        update: {},
        create: {
            name: 'mentor',
            parent: { connect: { id: adminRole.id } },
        },
    });

    const userRole = await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
            parent: { connect: { id: mentorRole.id } },
        },
    });

    // User 더미 데이터 생성 (upsert 사용, 고유 식별자로 email 사용)
    const user1 = await prisma.user.upsert({
        where: { email: 'test1@example.com' },
        update: {},
        create: {
            name: '테커짱',
            email: 'test1@example.com',
            nickname: 'johnny', // 닉네임 중복 주의!
            year: 7,
            password:
                '$2b$12$Rw9jlCjZlBz.YIE/rCKzEu0OoUmsujUwyk8LgTUZaaKGfYP9tvHTO',
            githubUrl: 'https://github.com/johndoe',
            mainPosition: 'BACKEND',
            subPosition: 'FRONTEND',
            school: '성결대학교',
            profileImage: 'https://example.com/profile.jpg',
            stack: ['Node.js', 'TypeScript', 'Docker'],
            grade: '1학년',
            roleId: userRole.id,
        },
    });

    const user2 = await prisma.user.upsert({
        where: { email: 'test2@example.com' },
        update: {},
        create: {
            name: '테커짱2',
            email: 'test2@example.com',
            nickname: 'johnny2', // 중복되지 않는 닉네임 사용
            year: 6,
            password:
                '$2b$12$Rw9jlCjZlBz.YIE/rCKzEu0OoUmsujUwyk8LgTUZaaKGfYP9tvHTO',
            githubUrl: 'https://github.com/johndoe',
            mainPosition: 'FRONTEND',
            subPosition: 'BACKEND',
            school: '한국공학대학교',
            profileImage: 'https://example.com/profile.jpg',
            stack: ['Node.js', 'TypeScript', 'Docker'],
            grade: '1학년',
            roleId: userRole.id,
        },
    });

    const user3 = await prisma.user.upsert({
        where: { email: 'test3@example.com' },
        update: {},
        create: {
            name: '테커짱3',
            email: 'test3@example.com',
            nickname: 'johnny3', // 중복되지 않는 닉네임 사용
            year: 5,
            password:
                '$2b$12$Rw9jlCjZlBz.YIE/rCKzEu0OoUmsujUwyk8LgTUZaaKGfYP9tvHTO',
            githubUrl: 'https://github.com/johndoe',
            mainPosition: 'FRONTEND',
            subPosition: 'BACKEND',
            school: '한국공학대학교',
            profileImage: 'https://example.com/profile.jpg',
            stack: ['Node.js', 'TypeScript', 'Docker'],
            grade: '1학년',
            roleId: userRole.id,
        },
    });

    // Stack 데이터 생성
    const stacks = [
        {
            name: 'React.js',
            category: 'FRONTEND',
        },
        {
            name: 'Vue.js',
            category: 'FRONTEND',
        },
        {
            name: 'Next.js',
            category: 'FRONTEND',
        },
        {
            name: 'SvelteKit',
            category: 'FRONTEND',
        },
        {
            name: 'Angular',
            category: 'FRONTEND',
        },
        {
            name: 'Django',
            category: 'BACKEND',
        },
        {
            name: 'Flask',
            category: 'BACKEND',
        },
        {
            name: 'Ruby on Rails',
            category: 'BACKEND',
        },
        {
            name: 'Spring Boot',
            category: 'BACKEND',
        },
        {
            name: 'Express.js',
            category: 'BACKEND',
        },
        {
            name: 'Laravel',
            category: 'BACKEND',
        },
        {
            name: 'S3/Cloud Storage',
            category: 'DEVOPS',
        },
        {
            name: 'Go Lang',
            category: 'BACKEND',
        },
        {
            name: 'AI/ML (Tensorflow, PyTorch)',
            category: 'OTHER',
        },
        {
            name: 'Kubernetes',
            category: 'DEVOPS',
        },
        {
            name: 'Jenkins CI',
            category: 'DEVOPS',
        },
        {
            name: 'Github Actions',
            category: 'DEVOPS',
        },
        {
            name: 'Spinnaker',
            category: 'DEVOPS',
        },
        {
            name: 'Graphite',
            category: 'DEVOPS',
        },
        {
            name: 'Kafka',
            category: 'BACKEND',
        },
        {
            name: 'Docker',
            category: 'DEVOPS',
        },
        {
            name: 'Ansible',
            category: 'DEVOPS',
        },
        {
            name: 'Terraform',
            category: 'DEVOPS',
        },
        {
            name: 'FastAPI',
            category: 'BACKEND',
        },
        {
            name: 'Redis',
            category: 'BACKEND',
        },
        {
            name: 'MSA',
            category: 'BACKEND',
        },
        {
            name: 'Java',
            category: 'BACKEND',
        },
        {
            name: 'Python',
            category: 'BACKEND',
        },
        {
            name: 'JavaScript/TypeScript',
            category: 'FRONTEND',
        },
        {
            name: 'C/C++',
            category: 'BACKEND',
        },
        {
            name: 'C#',
            category: 'BACKEND',
        },
        {
            name: 'Ruby',
            category: 'BACKEND',
        },
        {
            name: 'AWS',
            category: 'DEVOPS',
        },
        {
            name: 'GCP',
            category: 'DEVOPS',
        },
        {
            name: 'ELK Stack',
            category: 'DEVOPS',
        },
        {
            name: 'Elasticsearch',
            category: 'DEVOPS',
        },
        {
            name: 'Prometheus',
            category: 'DEVOPS',
        },
        {
            name: 'Grafana',
            category: 'DEVOPS',
        },
        {
            name: 'Celery',
            category: 'BACKEND',
        },
        {
            name: 'Nginx',
            category: 'DEVOPS',
        },
        {
            name: 'CDN (CloudFront)',
            category: 'DEVOPS',
        },
        {
            name: 'Nest.JS',
            category: 'BACKEND',
        },
        {
            name: 'Zustand',
            category: 'FRONTEND',
        },
        {
            name: 'Tailwind CSS',
            category: 'FRONTEND',
        },
        {
            name: 'Bootstrap',
            category: 'FRONTEND',
        },
        {
            name: 'PostgreSQL',
            category: 'DATABASE',
        },
        {
            name: 'MySQL',
            category: 'DATABASE',
        },
        {
            name: 'MongoDB',
            category: 'DATABASE',
        },
        {
            name: 'Node.js',
            category: 'BACKEND',
        },
        {
            name: 'Apollo GraphQL',
            category: 'BACKEND',
        },
        {
            name: 'GraphQL',
            category: 'BACKEND',
        },
        {
            name: 'Redux',
            category: 'FRONTEND',
        },
        {
            name: 'MobX',
            category: 'FRONTEND',
        },
        {
            name: 'Vuex',
            category: 'FRONTEND',
        },
        {
            name: 'Jest',
            category: 'FRONTEND',
        },
        {
            name: 'Mocha',
            category: 'FRONTEND',
        },
        {
            name: 'Cypress',
            category: 'FRONTEND',
        },
        {
            name: 'Traefik',
            category: 'DEVOPS',
        },
        {
            name: 'Selenium',
            category: 'OTHER',
        },
        {
            name: 'gRPC',
            category: 'OTHER',
        },
        {
            name: 'Docker Compose',
            category: 'DEVOPS',
        },
        {
            name: 'Docker Swarm',
            category: 'DEVOPS',
        },
        {
            name: 'React Native',
            category: 'FRONTEND',
        },
        {
            name: 'Flutter',
            category: 'FRONTEND',
        },
        {
            name: 'Figma',
            category: 'OTHER',
        },
        {
            name: 'Zeplin',
            category: 'OTHER',
        },
        {
            name: 'NX',
            category: 'FRONTEND',
        },
        {
            name: 'Shadcn/ui',
            category: 'FRONTEND',
        },
        {
            name: 'Turborepo',
            category: 'FRONTEND',
        },
        {
            name: 'Lerna',
            category: 'FRONTEND',
        },
        {
            name: 'Chromatic',
            category: 'FRONTEND',
        },
        {
            name: 'PlayWright',
            category: 'FRONTEND',
        },
        {
            name: 'Storybook',
            category: 'FRONTEND',
        },
        {
            name: 'Vite',
            category: 'FRONTEND',
        },
        {
            name: 'Vitest',
            category: 'FRONTEND',
        },
        {
            name: 'K6',
            category: 'OTHER',
        },
        {
            name: 'Locust',
            category: 'OTHER',
        },
        {
            name: 'JMeter',
            category: 'OTHER',
        },
        {
            name: 'Postman',
            category: 'OTHER',
        },
        {
            name: 'Insomnia',
            category: 'OTHER',
        },
        {
            name: 'React Testing Library',
            category: 'FRONTEND',
        },
        {
            name: 'RabbitMQ',
            category: 'DEVOPS',
        },
    ];

    for (const stack of stacks) {
        await prisma.stack.upsert({
            where: { name: stack.name } as Prisma.StackWhereUniqueInput,
            update: {},
            create: stack as Prisma.StackCreateInput,
        });
    }

    Logger.log('Stacks have been seeded successfully!');

    await prisma.userExperience.upsert({
        where: {
            userId_position_companyName_startDate: {
                userId: user1.id,
                position: 'BACKEND',
                companyName: 'Tech Corp',
                startDate: new Date('2021-06-01'),
            },
        },
        update: {}, // 이미 데이터가 존재하면 여기에 업데이트할 내용을 추가하세요.
        create: {
            userId: user1.id,
            position: 'BACKEND',
            companyName: 'Tech Corp',
            startDate: new Date('2021-06-01'),
            endDate: new Date('2023-06-01'),
            category: 'INTERN',
            isFinished: true,
        },
    });

    await prisma.userExperience.upsert({
        where: {
            userId_position_companyName_startDate: {
                userId: user2.id,
                position: 'DATA_ENGINEER',
                companyName: 'Palo Alto Networks',
                startDate: new Date('2022-06-01'),
            },
        },
        update: {},
        create: {
            userId: user2.id,
            position: 'DATA_ENGINEER',
            companyName: 'Palo Alto Networks',
            startDate: new Date('2022-06-01'),
            endDate: new Date('2023-06-01'),
            category: 'FULL_TIME',
            isFinished: true,
        },
    });

    await prisma.userExperience.upsert({
        where: {
            userId_position_companyName_startDate: {
                userId: user3.id,
                position: 'DEVOPS',
                companyName: 'CrowdStrike',
                startDate: new Date('2021-06-01'),
            },
        },
        update: {},
        create: {
            userId: user3.id,
            position: 'DEVOPS',
            companyName: 'CrowdStrike',
            startDate: new Date('2021-06-01'),
            endDate: new Date('2023-12-01'),
            category: 'FULL_TIME',
            isFinished: true,
        },
    });

    // Session 데이터 생성
    await prisma.session.create({
        data: {
            userId: user1.id,
            title: 'NestJS Best Practices',
            likeCount: 10,
            viewCount: 100,
            thumbnail: 'https://example.com/session.jpg',
            videoUrl: 'https://youtube.com/example',
            fileUrl: 'https://example.com/file.pdf',
            presenter: 'John Doe',
            date: '2023-02-01',
            category: 'BOOTCAMP',
            position: 'BACKEND',
        },
    });

    await prisma.session.create({
        data: {
            userId: user2.id,
            title: 'Grafana Dashboard Tutorial',
            likeCount: 10,
            viewCount: 1,
            thumbnail: 'https://example.com/session.jpg',
            videoUrl: 'https://youtube.com/example',
            fileUrl: 'https://example.com/file.pdf',
            presenter: 'test123',
            date: '2023-02-01',
            category: 'BOOTCAMP',
            position: 'BACKEND',
        },
    });

    await prisma.session.create({
        data: {
            userId: user3.id,
            title: 'NestJS Best Practices',
            likeCount: 10,
            viewCount: 100,
            thumbnail: 'https://example.com/session.jpg',
            videoUrl: 'https://youtube.com/example',
            fileUrl: 'https://example.com/file.pdf',
            presenter: 'Harry Potter',
            date: '2023-02-01',
            category: 'BOOTCAMP',
            position: 'FRONTEND',
        },
    });

    // Resume 데이터 생성
    await prisma.resume.create({
        data: {
            userId: user1.id,
            title: 'John Doe Resume',
            url: 'https://example.com/resume.pdf',
            isMain: true,
            category: 'PORTFOLIO',
            position: 'BACKEND',
            likeCount: 5,
            viewCount: 500,
        },
    });

    await prisma.resume.create({
        data: {
            userId: user2.id,
            title: 'John Doe Resume',
            url: 'https://example.com/resume.pdf',
            isMain: true,
            category: 'ICT',
            position: 'FRONTEND',
            likeCount: 5,
            viewCount: 50,
        },
    });

    await prisma.resume.create({
        data: {
            userId: user3.id,
            title: 'John Doe Resume',
            url: 'https://example.com/resume.pdf',
            isMain: true,
            category: 'PORTFOLIO',
            position: 'FRONTEND',
            likeCount: 50000,
            viewCount: 50000,
        },
    });

    // Event 데이터 생성
    await prisma.event.create({
        data: {
            userId: user1.id,
            title: 'Tech Conference 2024',
            category: 'Technology',
            startDate: new Date('2024-05-01'),
            endDate: new Date('2024-05-03'),
            url: 'https://techconference.com',
        },
    });

    await prisma.event.create({
        data: {
            userId: user2.id,
            title: '테커 파티',
            category: 'Technology',
            startDate: new Date('2024-09-08'),
            endDate: new Date('2024-09-08'),
            url: 'https://techconference.com',
        },
    });

    // 생성한 유저 가져오기
    const allUsers = await prisma.user.findMany();

    // 프로젝트 팀 3개씩 생성
    for (const user of allUsers) {
        for (let i = 1; i <= 3; i++) {
            await prisma.projectTeam.upsert({
                where: {
                    name: `${user.name}'s Project ${i}`,
                },
                update: {
                    // 이미 존재할 경우 업데이트할 필드를 지정할 수 있습니다.
                    // 만약 업데이트할 필요가 없다면 빈 객체 {}를 사용하세요.
                },
                create: {
                    name: `${user.name}'s Project ${i}`,
                    githubLink: `https://github.com/${user.name.toLowerCase()}-project-${i}`,
                    notionLink: `https://notion.so/${user.name.toLowerCase()}-project-${i}`,
                    projectExplain: `This is a project created by ${user.name}.`,
                    frontendNum: 2,
                    backendNum: 2,
                    devopsNum: 1,
                    uiuxNum: 1,
                    dataEngineerNum: 1,
                    recruitExplain: `We are looking for contributors for ${user.name}'s project ${i}!`,
                },
            });
        }
    }

    // 스터디 팀 3개씩 생성
    for (const user of allUsers) {
        for (let i = 1; i <= 3; i++) {
            await prisma.studyTeam.upsert({
                where: { name: `${user.name}'s Study ${i}` },
                update: {}, // 이미 존재하는 경우 업데이트할 내용
                create: {
                    name: `${user.name}'s Study ${i}`,
                    githubLink: `https://github.com/${user.name.toLowerCase()}-study-${i}`,
                    notionLink: `https://notion.so/${user.name.toLowerCase()}-study-${i}`,
                    studyExplain: `This is a study group organized by ${user.name}.`,
                    goal: `The goal of this study is to improve skills for ${user.name}.`,
                    rule: `Each member must contribute to ${user.name}'s study ${i}.`,
                    recruitNum: 5,
                    recruitExplain: `Looking for members to join ${user.name}'s study ${i}.`,
                },
            });
        }
    }

    const allProjects = await prisma.projectTeam.findMany();
    const allStudies = await prisma.studyTeam.findMany();

    // 각 프로젝트에 모든 유저를 멤버로 추가
    // 각 프로젝트에 모든 유저를 멤버로 추가 (ProjectMember)
    for (const project of allProjects) {
        for (const user of allUsers) {
            await prisma.projectMember.upsert({
                where: {
                    projectTeamId_userId_unique: {
                        projectTeamId: project.id,
                        userId: user.id,
                    },
                },
                update: {
                    // 이미 존재하는 경우 업데이트할 내용을 넣으세요.
                    // 만약 업데이트가 필요 없다면 빈 객체 {}를 사용하세요.
                },
                create: {
                    userId: user.id,
                    projectTeamId: project.id,
                    isLeader: Math.random() > 0.5,
                    teamRole: 'Developer',
                    summary: `${user.name} is working on ${project.name}`,
                    status: 'APPROVED',
                },
            });
        }

        // 각 프로젝트당 결과 이미지는 한 번만 생성
        for (const project of allProjects) {
            await prisma.projectResultImage.create({
                data: {
                    projectTeamId: project.id,
                    imageUrl: `https://example.com/project-${project.id}-image.jpg`,
                },
            });
        }

        // 각 스터디에 모든 유저를 멤버로 추가
        for (const study of allStudies) {
            for (const user of allUsers) {
                await prisma.studyMember.upsert({
                    where: {
                        studyTeamId_userId: {
                            studyTeamId: study.id,
                            userId: user.id,
                        },
                    },
                    update: {},
                    create: {
                        userId: user.id,
                        studyTeamId: study.id,
                        isLeader: Math.random() > 0.5,
                        summary: `${user.name} is studying in ${study.name}`,
                        status: 'APPROVED',
                    },
                });
            }
        }

        // 각 스터디당 결과 이미지는 한 번만 생성
        for (const study of allStudies) {
            await prisma.studyResultImage.create({
                data: {
                    studyTeamId: study.id,
                    imageUrl: `https://example.com/study-${study.id}-image.jpg`,
                },
            });
        }

        // Blog 데이터 생성
        await prisma.blog.create({
            data: {
                userId: user1.id,
                title: 'My Journey with NestJS',
                url: 'https://blog.example.com/nestjs-journey',
                date: new Date('2023-03-01'),
                author: 'John Doe',
                authorImage: 'https://example.com/john.jpg',
                category: 'SHARED',
                thumbnail: 'https://example.com/blog-thumbnail.jpg',
                tags: ['NestJS', 'TypeScript', 'Backend'],
                likeCount: 15,
                viewCount: 10,
            },
        });

        await prisma.blog.create({
            data: {
                userId: user2.id,
                title: '목데이터 생성하는 방법 101',
                url: 'https://blog.example.com/nestjs-journey',
                date: new Date('2023-03-01'),
                author: 'John Doe',
                authorImage: 'https://example.com/john.jpg',
                category: 'SHARED',
                thumbnail: 'https://example.com/blog-thumbnail.jpg',
                tags: ['NestJS', 'TypeScript', 'Backend'],
                likeCount: 15,
                viewCount: 100,
            },
        });

        await prisma.blog.create({
            data: {
                userId: user3.id,
                title: '프리즈마를 써보자',
                url: 'https://blog.example.com/prisma',
                date: new Date('2023-03-01'),
                author: 'ganadara',
                authorImage: 'https://example.com/john.jpg',
                category: 'SHARED',
                thumbnail: 'https://example.com/blog-thumbnail.jpg',
                tags: ['NestJS', 'TypeScript', 'Backend'],
                likeCount: 15,
                viewCount: 200000000,
            },
        });

        Logger.log('All mock data has been seeded successfully!');
    }
}

main()
    .catch((e) => {
        Logger.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
