import { NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import type { Event, Organization } from "../../generated/prisma/client";
import { EventStatus } from "../../generated/prisma/enums";
import type { PrismaService } from "../../infrastructure/database/prisma.service";
import { AdminEventsService } from "./admin-events.service";

describe("AdminEventsService", () => {
  const actorSubject = "admin-test-subject";
  const now = new Date("2026-09-26T12:00:00.000Z");
  const organization: Organization = {
    id: "01990000-0000-7000-8000-000000000001",
    code: "UFC",
    name: "UFC",
    createdAt: now,
    updatedAt: now,
  };
  const model: Event & { organization: Organization } = {
    id: "01990000-0000-7000-8000-000000000104",
    organizationId: organization.id,
    name: "[DEV] Example Event",
    startTime: new Date("2030-01-12T23:00:00.000Z"),
    timezone: "America/New_York",
    status: EventStatus.SCHEDULED,
    venueName: null,
    city: "Example City",
    countryCode: "US",
    createdAt: now,
    updatedAt: now,
    organization,
  };

  it("creates a scheduled event and maps its organization", async () => {
    const create = jest.fn().mockResolvedValue(model);
    const createAuditLog = jest.fn().mockResolvedValue({});
    const prisma = prismaWithTransaction({
      event: { create },
      adminAuditLog: { create: createAuditLog },
    });
    const service = new AdminEventsService(prisma);

    await expect(
      service.create(
        {
          organizationId: organization.id,
          name: model.name,
          startTime: "2030-01-12T18:00:00.000-05:00",
          timezone: model.timezone,
          city: model.city,
          countryCode: model.countryCode,
        },
        actorSubject,
      ),
    ).resolves.toEqual({
      id: model.id,
      name: model.name,
      startTime: "2030-01-12T23:00:00.000Z",
      timezone: model.timezone,
      status: EventStatus.SCHEDULED,
      venueName: null,
      city: model.city,
      countryCode: model.countryCode,
      organization: {
        id: organization.id,
        code: organization.code,
        name: organization.name,
      },
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        organizationId: organization.id,
        name: model.name,
        startTime: new Date("2030-01-12T23:00:00.000Z"),
        timezone: model.timezone,
        status: EventStatus.SCHEDULED,
        venueName: null,
        city: model.city,
        countryCode: model.countryCode,
      },
      include: { organization: true },
    });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        actorSubject,
        action: "CREATE",
        entityType: "EVENT",
        entityId: model.id,
      },
    });
  });

  it("reports an unknown organization as not found", async () => {
    const foreignKeyError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      {
        code: "P2003",
        clientVersion: "7.10.0",
        meta: { field_name: "Event_organizationId_fkey" },
      },
    );
    const create = jest.fn().mockRejectedValue(foreignKeyError);
    const prisma = prismaWithTransaction({
      event: { create },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminEventsService(prisma);

    await expect(
      service.create(
        {
          organizationId: organization.id,
          name: model.name,
          startTime: model.startTime.toISOString(),
          timezone: model.timezone,
        },
        actorSubject,
      ),
    ).rejects.toThrow(NotFoundException);
  });

  it("does not hide unexpected database errors", async () => {
    const databaseError = new Error("database unavailable");
    const create = jest.fn().mockRejectedValue(databaseError);
    const prisma = prismaWithTransaction({
      event: { create },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminEventsService(prisma);

    await expect(
      service.create(
        {
          organizationId: organization.id,
          name: model.name,
          startTime: model.startTime.toISOString(),
          timezone: model.timezone,
        },
        actorSubject,
      ),
    ).rejects.toBe(databaseError);
  });

  it("fails the transaction when the audit record cannot be written", async () => {
    const auditError = new Error("audit unavailable");
    const prisma = prismaWithTransaction({
      event: { create: jest.fn().mockResolvedValue(model) },
      adminAuditLog: { create: jest.fn().mockRejectedValue(auditError) },
    });
    const service = new AdminEventsService(prisma);

    await expect(
      service.create(
        {
          organizationId: organization.id,
          name: model.name,
          startTime: model.startTime.toISOString(),
          timezone: model.timezone,
        },
        actorSubject,
      ),
    ).rejects.toBe(auditError);
  });

  function prismaWithTransaction(transaction: object): PrismaService {
    return {
      $transaction: jest.fn(
        (operation: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          operation(transaction as Prisma.TransactionClient),
      ),
    } as unknown as PrismaService;
  }
});
