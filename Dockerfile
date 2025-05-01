# 빌드 스테이지
FROM node:20-alpine3.20 AS builder

WORKDIR /app

# Dependency 설치
COPY package*.json ./
COPY tsconfig.json ./

RUN npm install && npm cache clean --force

# 소스코드 복사
COPY . .

# Prisma 클라이언트 생성
RUN npx prisma generate --schema=./prisma/schema.prisma 

# 빌드
RUN npm run build

# TypeScript 컴파일 (seed.ts 파일을 JavaScript로 변환)
RUN npx tsc -p tsconfig.json


# 베포용 빌드 이미지 스테이지
FROM node:20-alpine3.20

# 프로덕션 환경변수
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./
RUN npm install && npm cache clean --force

# 빌드된 파일들만 복사
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma/ ./prisma/
COPY --from=builder /app/node_modules ./node_modules

# 포트
EXPOSE 8000

# 실행
CMD [  "npm", "run", "start:migrate:prod" ]
