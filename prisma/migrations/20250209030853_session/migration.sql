/*
  Warnings:

  - You are about to alter the column `category` on the `Event` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `date` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `position` on the `Session` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.

*/
-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "category" DROP DEFAULT,
ALTER COLUMN "category" SET DATA TYPE VARCHAR(50);

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "date" SET NOT NULL,
ALTER COLUMN "date" DROP DEFAULT,
ALTER COLUMN "date" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "position" SET NOT NULL,
ALTER COLUMN "position" DROP DEFAULT,
ALTER COLUMN "position" SET DATA TYPE VARCHAR(50);
ALTER TABLE "Stack"
ADD CONSTRAINT "Stack_name_unique" UNIQUE ("name");

BEGIN;
CREATE TYPE "StackCategory_new" AS ENUM ('BACKEND', 'FRONTEND', 'DATABASE', 'DEVOPS', 'OTHER');
ALTER TABLE "Stack" ALTER COLUMN "category" TYPE "StackCategory_new" USING ("category"::text::"StackCategory_new");
ALTER TYPE "StackCategory" RENAME TO "StackCategory_old";
ALTER TYPE "StackCategory_new" RENAME TO "StackCategory";
DROP TYPE "StackCategory_old";
COMMIT;