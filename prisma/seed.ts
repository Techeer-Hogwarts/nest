import { Prisma, PrismaClient } from '@prisma/client';
import { Logger } from '@nestjs/common';

const prisma = new PrismaClient();

async function main(): Promise<void> {
    // Roles
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

    // Stack Seeding
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

    // Insert the stacks
    for (const stack of stacks) {
        await prisma.stack.upsert({
            where: { name: stack.name } as Prisma.StackWhereUniqueInput,
            update: {},
            create: stack as Prisma.StackCreateInput,
        });
    }

    Logger.log('Roles and Stacks have been seeded:', {
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
