/*
  Warnings:

  - The values [SOMA] on the enum `ResumeCategory` will be removed. If these variants are still used in the database, this will fail.
  - Added the required column `position` to the `Resume` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ResumeCategory_new" AS ENUM ('RESUME', 'PORTFOLIO', 'ICT', 'OTHER');
ALTER TABLE "Resume" ALTER COLUMN "category" TYPE "ResumeCategory_new" USING ("category"::text::"ResumeCategory_new");
ALTER TYPE "ResumeCategory" RENAME TO "ResumeCategory_old";
ALTER TYPE "ResumeCategory_new" RENAME TO "ResumeCategory";
DROP TYPE "ResumeCategory_old";
COMMIT;

-- AlterTable
ALTER TABLE "Resume" ADD COLUMN     "position" VARCHAR(100) NOT NULL;
