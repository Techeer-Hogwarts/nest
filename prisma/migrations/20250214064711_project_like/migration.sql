-- AlterTable
ALTER TABLE "ProjectTeam" ADD COLUMN     "likeCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "viewCount" INTEGER NOT NULL DEFAULT 0;

-- RenameIndex
ALTER INDEX "Stack_name_unique" RENAME TO "Stack_name_key";
