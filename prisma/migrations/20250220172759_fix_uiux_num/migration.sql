/*
  Warnings:

  - You are about to drop the column `uiuxNum` on the `ProjectTeam` table. All the data in the column will be lost.
  - Added the required column `fullStackNum` to the `ProjectTeam` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ProjectTeam" RENAME COLUMN "uiuxNum" TO "fullStackNum";

-- AlterTable
ALTER TABLE "SyncDb" ALTER COLUMN "lastSyncedAt" SET DEFAULT '2000-01-01 00:00:00';
