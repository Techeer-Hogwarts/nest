/*
  Warnings:

  - You are about to drop the column `tag` on the `Blog` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "tag",
ADD COLUMN     "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];
