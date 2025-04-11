/*
  Warnings:

  - Changed the type of `category` on the `Blog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `Resume` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Blog" DROP COLUMN "category",
ADD COLUMN     "category" VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE "Resume" DROP COLUMN "category",
ADD COLUMN     "category" VARCHAR(50) NOT NULL;

-- DropEnum
DROP TYPE "BlogCategory";

-- DropEnum
DROP TYPE "ResumeCategory";
