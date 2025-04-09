import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';

import { PrismaClient } from '@prisma/client';
import kyselyExtension from 'prisma-extension-kysely';
import {
    Kysely,
    PostgresAdapter,
    PostgresIntrospector,
    PostgresQueryCompiler,
} from 'kysely';
import { DB } from './db/types';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
    extends PrismaClient
    implements OnModuleInit, OnModuleDestroy
{
    /**
     * DB: Kysely에서 Prisma 스키마를 기반으로 생성한 TypeScript 타입 (DB 테이블 타입 정의)
     * driver: Prisma에서 제공하는 데이터베이스 드라이버 (PrismaClient의 내부 DB 연결 객체)
     * createDriver: Kysely가 Prisma의 DB 연결을 사용할 수 있도록 설정
     * createAdapter: Kysely에서 사용할 PostgresAdapter 설정 (PostgreSQL을 사용하도록 설정)
     * createIntrospector: Kysely가 DB 스키마 정보를 introspect하는 기능 (스키마 정보 조회)
     * createQueryCompiler: Kysely의 SQL 쿼리 생성 로직을 설정하는 기능
     */
    async onModuleInit(): Promise<void> {
        await this.$connect();
        const extendedPrisma = this.$extends(
            kyselyExtension({
                kysely: (driver): Kysely<DB> => {
                    return new Kysely<DB>({
                        dialect: {
                            createDriver: () => driver,
                            createAdapter: () => new PostgresAdapter(),
                            createIntrospector: (db) =>
                                new PostgresIntrospector(db),
                            createQueryCompiler: () =>
                                new PostgresQueryCompiler(),
                        },
                    });
                },
            }),
        ) as unknown as PrismaService & { $kysely: Kysely<DB> };

        this.$kysely = extendedPrisma.$kysely;
    }

    async onModuleDestroy(): Promise<void> {
        await this.$disconnect();
    }

    declare $kysely: Kysely<DB>;
}
