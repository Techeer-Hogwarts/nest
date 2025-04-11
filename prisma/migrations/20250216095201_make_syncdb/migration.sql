-- CreateTable
CREATE TABLE "SyncDb" (
    "id" SERIAL NOT NULL,
    "lastSyncedAt" TIMESTAMP(3) NOT NULL DEFAULT '2000-01-01 00:00:00',

    CONSTRAINT "SyncDb_pkey" PRIMARY KEY ("id")
);
