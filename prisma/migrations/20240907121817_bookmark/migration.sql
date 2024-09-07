-- CreateEnum
CREATE TYPE "Type" AS ENUM ('RESUME', 'SESSION', 'BLOG');

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "contend_id" INTEGER NOT NULL,
    "type" "Type" NOT NULL,

    CONSTRAINT "Bookmark_pkey" PRIMARY KEY ("id")
);
