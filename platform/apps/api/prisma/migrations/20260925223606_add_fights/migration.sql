-- CreateTable
CREATE TABLE "Fight" (
    "id" UUID NOT NULL,
    "eventId" UUID NOT NULL,
    "cardPosition" INTEGER NOT NULL,
    "redCornerName" VARCHAR(120) NOT NULL,
    "blueCornerName" VARCHAR(120) NOT NULL,
    "weightClass" VARCHAR(80),
    "isTitleFight" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Fight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Fight_eventId_cardPosition_key" ON "Fight"("eventId", "cardPosition");

-- AddForeignKey
ALTER TABLE "Fight" ADD CONSTRAINT "Fight_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;
