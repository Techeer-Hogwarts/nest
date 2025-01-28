/*
  Warnings:

  - The `status` column on the `PermissionRequest` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `blogUrl` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `class` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullTimeCompanyName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullTimeEndDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullTimePosition` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `fullTimeStartDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `internCompanyName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `internEndDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `internPosition` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `internStartDate` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isFullTime` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `isIntern` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[projectTeamId,userId]` on the table `ProjectMember` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `grade` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PermissionRequest" DROP COLUMN "status",
ADD COLUMN     "status" "StatusCategory" NOT NULL DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "User" DROP COLUMN "blogUrl",
DROP COLUMN "class",
DROP COLUMN "fullTimeCompanyName",
DROP COLUMN "fullTimeEndDate",
DROP COLUMN "fullTimePosition",
DROP COLUMN "fullTimeStartDate",
DROP COLUMN "internCompanyName",
DROP COLUMN "internEndDate",
DROP COLUMN "internPosition",
DROP COLUMN "internStartDate",
DROP COLUMN "isFullTime",
DROP COLUMN "isIntern",
ADD COLUMN     "grade" VARCHAR(100) NOT NULL,
ADD COLUMN     "mediumUrl" VARCHAR(200),
ADD COLUMN     "tistoryUrl" VARCHAR(200),
ADD COLUMN     "velogUrl" VARCHAR(200);

-- CreateTable
CREATE TABLE "UserExperience" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "userId" INTEGER NOT NULL,
    "position" VARCHAR(100) NOT NULL,
    "companyName" VARCHAR(200) NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "category" VARCHAR(100) NOT NULL,
    "isFinished" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserExperience_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectTeamId_userId_key" ON "ProjectMember"("projectTeamId", "userId");

-- AddForeignKey
ALTER TABLE "UserExperience" ADD CONSTRAINT "UserExperience_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "UserExperience" ADD CONSTRAINT "UserExperience_userId_position_companyName_startDate_key" UNIQUE ("userId", "position", "companyName", "startDate");
