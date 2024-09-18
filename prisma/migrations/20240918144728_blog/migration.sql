/*
  Warnings:

  - Added the required column `category` to the `Blog` table without a default value. This is not possible if the table is not empty.
  - Added the required column `date` to the `Blog` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Blog" ADD COLUMN     "category" VARCHAR(200) NOT NULL,
ADD COLUMN     "date" TIMESTAMP(3) NOT NULL;
