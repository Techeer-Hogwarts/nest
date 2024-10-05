/*
  Warnings:

  - You are about to alter the column `category` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `VarChar(200)` to `VarChar(50)`.
  - Added the required column `position` to the `Session` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Session" ADD COLUMN     "position" VARCHAR(50) NOT NULL,
ALTER COLUMN "likeCount" SET DEFAULT 0,
ALTER COLUMN "viewCount" SET DEFAULT 0,
ALTER COLUMN "category" SET DATA TYPE VARCHAR(50);
