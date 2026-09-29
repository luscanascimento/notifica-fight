-- AlterTable
ALTER TABLE "Event" ADD COLUMN     "externalId" VARCHAR(64);

-- AlterTable
ALTER TABLE "Fight" ADD COLUMN     "externalId" VARCHAR(64);

-- CreateIndex
CREATE INDEX "Event_externalId_idx" ON "Event"("externalId");

-- CreateIndex
CREATE INDEX "Fight_externalId_idx" ON "Fight"("externalId");
