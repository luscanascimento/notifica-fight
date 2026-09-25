import { EventStatus } from "../../generated/prisma/enums";
import type { Event, Organization } from "../../generated/prisma/client";
import type { PrismaService } from "../../infrastructure/database/prisma.service";
import { EventsService } from "./events.service";

describe("EventsService", () => {
  const now = new Date("2026-09-25T12:00:00.000Z");
  const model: Event & { organization: Organization } = {
    id: "01990000-0000-7000-8000-000000000101",
    organizationId: "01990000-0000-7000-8000-000000000001",
    name: "[DEV] Example Event",
    startTime: new Date("2030-01-12T23:00:00.000Z"),
    timezone: "America/New_York",
    status: EventStatus.SCHEDULED,
    venueName: null,
    city: "Example City",
    countryCode: "US",
    createdAt: now,
    updatedAt: now,
    organization: {
      id: "01990000-0000-7000-8000-000000000001",
      code: "UFC",
      name: "UFC",
      createdAt: now,
      updatedAt: now,
    },
  };

  it("returns only the mapped upcoming events in database order", async () => {
    const findMany = jest.fn().mockResolvedValue([model]);
    const prisma = { event: { findMany } } as unknown as PrismaService;
    const service = new EventsService(prisma);

    await expect(service.findUpcoming(now)).resolves.toEqual([
      {
        id: model.id,
        name: model.name,
        startTime: "2030-01-12T23:00:00.000Z",
        timezone: model.timezone,
        status: EventStatus.SCHEDULED,
        venueName: null,
        city: "Example City",
        countryCode: "US",
        organization: {
          id: model.organization.id,
          code: "UFC",
          name: "UFC",
        },
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({
      where: {
        startTime: { gte: now },
        status: { in: [EventStatus.SCHEDULED, EventStatus.POSTPONED] },
      },
      include: { organization: true },
      orderBy: { startTime: "asc" },
      take: 50,
    });
  });

  it("returns a mapped event by ID", async () => {
    const findUnique = jest.fn().mockResolvedValue(model);
    const prisma = { event: { findUnique } } as unknown as PrismaService;
    const service = new EventsService(prisma);

    await expect(service.findById(model.id)).resolves.toEqual({
      id: model.id,
      name: model.name,
      startTime: "2030-01-12T23:00:00.000Z",
      timezone: model.timezone,
      status: EventStatus.SCHEDULED,
      venueName: null,
      city: "Example City",
      countryCode: "US",
      organization: {
        id: model.organization.id,
        code: "UFC",
        name: "UFC",
      },
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: model.id },
      include: { organization: true },
    });
  });

  it("throws not found when the event does not exist", async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const prisma = { event: { findUnique } } as unknown as PrismaService;
    const service = new EventsService(prisma);

    await expect(service.findById(model.id)).rejects.toMatchObject({
      status: 404,
      message: "Event not found",
    });
  });
});
