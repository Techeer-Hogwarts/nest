-- CreateTable
CREATE TABLE "Team" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "isRecruited" BOOLEAN NOT NULL DEFAULT true,
    "isFinished" BOOLEAN NOT NULL DEFAULT true,
    "name" VARCHAR(100) NOT NULL,
    "category" VARCHAR(100) NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);
