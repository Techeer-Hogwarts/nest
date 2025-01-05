/*
  Warnings:

  - Changed the type of `category` on the `Blog` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "BlogCategory" AS ENUM ('TECHEER', 'SHARED');

-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "author" VARCHAR(100),
ADD COLUMN     "authorImage" VARCHAR(200),
ADD COLUMN     "tag" TEXT[] DEFAULT ARRAY[]::TEXT[],
ALTER COLUMN "url" SET DATA TYPE VARCHAR(200),
DROP COLUMN "category",
ADD COLUMN     "category" "BlogCategory" NOT NULL;
