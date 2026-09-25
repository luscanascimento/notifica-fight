import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { EventStatus } from "../src/generated/prisma/enums";

const databaseUrl = process.env["DATABASE_URL"];

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to seed the database");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const organizations = [
  { id: "01990000-0000-7000-8000-000000000001", code: "UFC", name: "UFC" },
  {
    id: "01990000-0000-7000-8000-000000000002",
    code: "ONE",
    name: "ONE Championship",
  },
  { id: "01990000-0000-7000-8000-000000000003", code: "RWS", name: "RWS" },
] as const;

const developmentEvents = [
  {
    id: "01990000-0000-7000-8000-000000000101",
    organizationId: organizations[0].id,
    name: "[DEV] UFC Example Event",
    startTime: new Date("2030-01-12T23:00:00.000Z"),
    timezone: "America/New_York",
    status: EventStatus.SCHEDULED,
    venueName: "Development Arena",
    city: "Example City",
    countryCode: "US",
  },
  {
    id: "01990000-0000-7000-8000-000000000102",
    organizationId: organizations[1].id,
    name: "[DEV] ONE Example Event",
    startTime: new Date("2030-02-08T12:00:00.000Z"),
    timezone: "Asia/Singapore",
    status: EventStatus.SCHEDULED,
    venueName: null,
    city: "Example City",
    countryCode: "SG",
  },
  {
    id: "01990000-0000-7000-8000-000000000103",
    organizationId: organizations[2].id,
    name: "[DEV] RWS Example Event",
    startTime: new Date("2030-03-09T12:00:00.000Z"),
    timezone: "Asia/Bangkok",
    status: EventStatus.SCHEDULED,
    venueName: "Development Stadium",
    city: "Example City",
    countryCode: "TH",
  },
] as const;

async function seed(): Promise<void> {
  for (const organization of organizations) {
    await prisma.organization.upsert({
      where: { code: organization.code },
      update: { name: organization.name },
      create: organization,
    });
  }

  for (const event of developmentEvents) {
    await prisma.event.upsert({
      where: { id: event.id },
      update: event,
      create: event,
    });
  }
}

seed()
  .then(async () => prisma.$disconnect())
  .catch(async (error: unknown) => {
    console.error("Database seed failed");
    await prisma.$disconnect();
    process.exitCode = 1;
    if (process.env["NODE_ENV"] === "development") {
      console.error(error);
    }
  });
