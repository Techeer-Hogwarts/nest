# 빌드 스테이지
FROM node:18-alpine AS builder

WORKDIR /app

# Dependency 설치
COPY package*.json ./

RUN npm install

# 소스코드 복사
COPY . .

# 빌드
RUN npm run build

# 베포용 빌드 이미지 스테이지
FROM node:18-alpine

# 프로덕션 환경변수
ENV NODE_ENV=production

WORKDIR /app

COPY package*.json ./

# 빌드된 파일들만 복사
COPY --from=builder /app/dist ./dist

# 포트
EXPOSE 3000

# 실행
CMD ["node", "dist/main.js"]