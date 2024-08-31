# 빌드 스테이지
FROM oven/bun:alpine as builder

WORKDIR /app

# Dependency 설치
COPY package*.json ./

RUN bun install

# 소스코드 복사
COPY . .

# Prisma 클라이언트 생성 
RUN npx prisma generate --schema=./prisma/schema.prisma

# 빌드
RUN bun run build

# 베포용 빌드 이미지 스테이지
FROM oven/bun:alpine

# 프로덕션 환경변수
ENV NODE_ENV=production

WORKDIR /app

# 프로덕션 종속성만 설치
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/bun.lockb ./
RUN bun install --production

# 빌드된 파일들만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 포트
EXPOSE 8000

# 실행
CMD [  "bun", "run", "start:migrate:prod" ]