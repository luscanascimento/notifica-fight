CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'POSTPONED', 'CANCELED', 'FINISHED');

CREATE TABLE "Organization" (
    "id" UUID NOT NULL,
    "code" VARCHAR(32) NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Event" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "startTime" TIMESTAMPTZ(3) NOT NULL,
    "timezone" VARCHAR(64) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "venueName" VARCHAR(160),
    "city" VARCHAR(100),
    "countryCode" CHAR(2),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Event_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "Event_countryCode_check"
      CHECK ("countryCode" IS NULL OR "countryCode" ~ '^[A-Z]{2}$')
);

CREATE UNIQUE INDEX "Organization_code_key" ON "Organization"("code");
CREATE INDEX "Event_status_startTime_idx" ON "Event"("status", "startTime");
CREATE INDEX "Event_organizationId_startTime_idx" ON "Event"("organizationId", "startTime");

ALTER TABLE "Event"
ADD CONSTRAINT "Event_organizationId_fkey"
FOREIGN KEY ("organizationId") REFERENCES "Organization"("id")
ON DELETE RESTRICT ON UPDATE CASCADE;
