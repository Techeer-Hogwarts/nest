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

    // const userRole = await prisma.role.upsert({
    await prisma.role.upsert({
        where: { name: 'user' },
        update: {},
        create: {
            name: 'user',
            parent: { connect: { id: mentorRole.id } },
        },
    });

    // User 더미 데이터 생성 (upsert 사용, 고유 식별자로 email 사용)
    // await prisma.user.upsert({
    //     where: { email: 'test1@example.com' },
    //     update: {},
    //     create: {
    //         name: '테커짱',
    //         email: 'test1@example.com',
    //         nickname: 'johnny', // 닉네임 중복 주의!
    //         year: 7,
    //         password:
    //             '$2b$12$Rw9jlCjZlBz.YIE/rCKzEu0OoUmsujUwyk8LgTUZaaKGfYP9tvHTO',
    //         githubUrl: 'https://github.com/johndoe',
    //         mainPosition: 'BACKEND',
    //         subPosition: 'FRONTEND',
    //         school: '성결대학교',
    //         profileImage: 'https://example.com/profile.jpg',
    //         stack: ['Node.js', 'TypeScript', 'Docker'],
    //         grade: '1학년',
    //         roleId: userRole.id,
    //     },
    // });
    //
    // await prisma.user.upsert({
    //     where: { email: 'test2@example.com' },
    //     update: {},
    //     create: {
    //         name: '테커짱2',
    //         email: 'test2@example.com',
    //         nickname: 'johnny2', // 중복되지 않는 닉네임 사용
    //         year: 6,
    //         password:
    //             '$2b$12$Rw9jlCjZlBz.YIE/rCKzEu0OoUmsujUwyk8LgTUZaaKGfYP9tvHTO',
    //         githubUrl: 'https://github.com/johndoe',
    //         mainPosition: 'FRONTEND',
    //         subPosition: 'BACKEND',
    //         school: '한국공학대학교',
    //         profileImage: 'https://example.com/profile.jpg',
    //         stack: ['Node.js', 'TypeScript', 'Docker'],
    //         grade: '1학년',
    //         roleId: userRole.id,
    //     },
    // });
    //
    // await prisma.user.upsert({
    //     where: { email: 'test3@example.com' },
    //     update: {},
    //     create: {
    //         name: '테커짱3',
    //         email: 'test3@example.com',
    //         nickname: 'johnny3', // 중복되지 않는 닉네임 사용
    //         year: 5,
    //         password:
    //             '$2b$12$Rw9jlCjZlBz.YIE/rCKzEu0OoUmsujUwyk8LgTUZaaKGfYP9tvHTO',
    //         githubUrl: 'https://github.com/johndoe',
    //         mainPosition: 'FRONTEND',
    //         subPosition: 'BACKEND',
    //         school: '한국공학대학교',
    //         profileImage: 'https://example.com/profile.jpg',
    //         stack: ['Node.js', 'TypeScript', 'Docker'],
    //         grade: '1학년',
    //         roleId: userRole.id,
    //     },
    // });

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
}

main()
    .catch((e) => {
        Logger.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
