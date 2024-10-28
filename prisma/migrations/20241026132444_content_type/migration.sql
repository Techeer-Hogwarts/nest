/*
  Warnings:

  - You are about to drop the column `Liketype` on the `Like` table. All the data in the column will be lost.
  - Changed the type of `Bookmarktype` on the `Bookmark` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `type` to the `Like` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('RESUME', 'SESSION', 'BLOG');

-- AlterTable
ALTER TABLE "Bookmark" DROP COLUMN "Bookmarktype",
ADD COLUMN     "Bookmarktype" "ContentType" NOT NULL;

-- AlterTable
ALTER TABLE "Like" DROP COLUMN "Liketype",
ADD COLUMN     "type" "ContentType" NOT NULL;

-- DropEnum
DROP TYPE "Type";
