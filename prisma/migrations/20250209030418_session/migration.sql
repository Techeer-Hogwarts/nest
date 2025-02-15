/*
  Warnings:

  - The `category` column on the `Event` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `date` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - The `position` column on the `Session` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Changed the type of `category` on the `Session` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Event" DROP COLUMN "category",
ADD COLUMN     "category" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Session" DROP COLUMN "date",
ADD COLUMN     "date" TEXT[] DEFAULT ARRAY[]::TEXT[],
DROP COLUMN "category",
ADD COLUMN     "category" VARCHAR(50) NOT NULL,
DROP COLUMN "position",
ADD COLUMN     "position" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- DropEnum
DROP TYPE "EventCategory";

-- DropEnum
DROP TYPE "SessionCategory";

-- DropEnum
DROP TYPE "SessionDate";

-- DropEnum
DROP TYPE "SessionPosition";
