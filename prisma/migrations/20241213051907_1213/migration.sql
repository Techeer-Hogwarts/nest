/*
  Warnings:

  - You are about to drop the column `teamId` on the `TeamStack` table. All the data in the column will be lost.
  - You are about to drop the `Team` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `TeamMember` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `projectTeamId` to the `TeamStack` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_teamId_fkey";

-- DropForeignKey
ALTER TABLE "TeamMember" DROP CONSTRAINT "TeamMember_userId_fkey";

-- DropForeignKey
ALTER TABLE "TeamStack" DROP CONSTRAINT "TeamStack_teamId_fkey";

-- AlterTable
ALTER TABLE "TeamStack" DROP COLUMN "teamId",
ADD COLUMN     "projectTeamId" INTEGER NOT NULL;

-- DropTable
DROP TABLE "Team";

-- DropTable
DROP TABLE "TeamMember";

CREATE TYPE "StatusCategory" AS ENUM ('APPROVED', 'REJECT', 'PENDING');

-- CreateTable
CREATE TABLE "ProjectMember" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isLeader" BOOLEAN NOT NULL,
    "teamRole" VARCHAR(100) NOT NULL,
    "projectTeamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "summary" VARCHAR(100) NOT NULL,
    "status" "StatusCategory" NOT NULL,

    CONSTRAINT "ProjectMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyMember" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isLeader" BOOLEAN NOT NULL,
    "studyTeamId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "summary" VARCHAR(100) NOT NULL,
    "status" "StatusCategory" NOT NULL,

    CONSTRAINT "StudyMember_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StudyMember_studyTeamId_userId_unique" UNIQUE ("studyTeamId", "userId")
);

-- CreateTable
CREATE TABLE "ProjectTeam" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isRecruited" BOOLEAN NOT NULL DEFAULT true,
    "isFinished" BOOLEAN NOT NULL DEFAULT true,
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "githubLink" VARCHAR(200) NOT NULL,
    "notionLink" VARCHAR(200) NOT NULL,
    "projectExplain" VARCHAR(200) NOT NULL,
    "frontendNum" INTEGER NOT NULL,
    "backendNum" INTEGER NOT NULL,
    "devopsNum" INTEGER NOT NULL,
    "uiuxNum" INTEGER NOT NULL,
    "dataEngineerNum" INTEGER NOT NULL,
    "recruitExplain" VARCHAR(200) NOT NULL,

    CONSTRAINT "ProjectTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudyTeam" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isRecruited" BOOLEAN NOT NULL DEFAULT true,
    "isFinished" BOOLEAN NOT NULL DEFAULT true,
    "name" VARCHAR(100) UNIQUE NOT NULL,
    "githubLink" VARCHAR(200) NOT NULL,
    "notionLink" VARCHAR(200) NOT NULL,
    "studyExplain" VARCHAR(200) NOT NULL,
    "goal" VARCHAR(300) NOT NULL,
    "rule" VARCHAR(300) NOT NULL,
    "recruitNum" INTEGER NOT NULL,
    "recruitExplain" VARCHAR(200) NOT NULL,

    CONSTRAINT "StudyTeam_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ProjectResultImage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" VARCHAR(300) NOT NULL,
    "projectTeamId" INTEGER NOT NULL,
    
    CONSTRAINT "ProjectResultImage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "ProjectResultImage_projectTeamId_fkey" FOREIGN KEY ("projectTeamId") REFERENCES "ProjectTeam" ("id") ON DELETE CASCADE
);

CREATE TABLE "StudyResultImage" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" VARCHAR(300) NOT NULL,
    "studyTeamId" INTEGER NOT NULL,
    
    CONSTRAINT "StudyResultImage_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "StudyResultImage_studyTeamId_fkey" FOREIGN KEY ("studyTeamId") REFERENCES "StudyTeam" ("id") ON DELETE CASCADE
);


-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_projectTeamId_fkey" FOREIGN KEY ("projectTeamId") REFERENCES "ProjectTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectMember" ADD CONSTRAINT "ProjectMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMember" ADD CONSTRAINT "StudyMember_userId_fkey" 
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudyMember" ADD CONSTRAINT "StudyMember_studyTeamId_fkey" 
    FOREIGN KEY ("studyTeamId") REFERENCES "StudyTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamStack" ADD CONSTRAINT "TeamStack_projectTeamId_fkey" FOREIGN KEY ("projectTeamId") REFERENCES "ProjectTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
