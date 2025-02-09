/*
  Warnings:

  - The values [OTEHR] on the enum `StackCategory` will be removed. If these variants are still used in the database, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Stack` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StackCategory_new" AS ENUM ('BACKEND', 'FRONTEND', 'DATABASE', 'DEVOPS', 'OTHER');
ALTER TABLE "Stack" ALTER COLUMN "category" TYPE "StackCategory_new" USING ("category"::text::"StackCategory_new");
ALTER TYPE "StackCategory" RENAME TO "StackCategory_old";
ALTER TYPE "StackCategory_new" RENAME TO "StackCategory";
DROP TYPE "StackCategory_old";
COMMIT;

-- CreateIndex
CREATE UNIQUE INDEX "Stack_name_key" ON "Stack"("name");
