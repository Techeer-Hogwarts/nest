/*
  Warnings:

  - A unique constraint covering the columns `[projectTeamId,userId]` on the table `ProjectMember` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `category` on the `Bookmark` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `Like` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "category",
ADD COLUMN     "category" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "category",
ADD COLUMN     "category" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "ProjectTeam" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StudyTeam" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- DropEnum
DROP TYPE "ContentCategory";

-- CreateIndex
CREATE UNIQUE INDEX "Bookmark_userId_contentId_category_key" ON "Bookmark"("userId", "contentId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "Like_userId_contentId_category_key" ON "Like"("userId", "contentId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectMember_projectTeamId_userId_key" ON "ProjectMember"("projectTeamId", "userId");
