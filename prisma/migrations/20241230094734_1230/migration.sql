-- DropForeignKey
ALTER TABLE "ProjectResultImage" DROP CONSTRAINT "ProjectResultImage_projectTeamId_fkey";

-- DropForeignKey
ALTER TABLE "StudyResultImage" DROP CONSTRAINT "StudyResultImage_studyTeamId_fkey";

ALTER TABLE "ProjectMainImage" DROP CONSTRAINT "ProjectMainImage_projectTeamId_fkey";

-- AddForeignKey
ALTER TABLE "StudyResultImage" ADD CONSTRAINT "StudyResultImage_studyTeamId_fkey" FOREIGN KEY ("studyTeamId") REFERENCES "StudyTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectResultImage" ADD CONSTRAINT "ProjectResultImage_projectTeamId_fkey" FOREIGN KEY ("projectTeamId") REFERENCES "ProjectTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProjectMainImage" ADD CONSTRAINT "ProjectMainImage_projectTeamId_fkey" FOREIGN KEY ("projectTeamId") REFERENCES "ProjectTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- RenameIndex
ALTER INDEX "StudyMember_studyTeamId_userId_unique" RENAME TO "StudyMember_studyTeamId_userId_key";
