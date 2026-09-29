import { BadRequestException, NotFoundException } from "@nestjs/common";
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
    externalId: null,
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

  it("updates and audits only the supplied event fields", async () => {
    const updatedModel = {
      ...model,
      startTime: new Date("2030-01-13T01:00:00.000Z"),
      status: EventStatus.POSTPONED,
      city: null,
    };
    const update = jest.fn().mockResolvedValue(updatedModel);
    const createAuditLog = jest.fn().mockResolvedValue({});
    const prisma = prismaWithTransaction({
      event: { update },
      adminAuditLog: { create: createAuditLog },
    });
    const service = new AdminEventsService(prisma);

    await expect(
      service.update(
        model.id,
        {
          startTime: "2030-01-12T20:00:00.000-05:00",
          status: EventStatus.POSTPONED,
          city: null,
        },
        actorSubject,
      ),
    ).resolves.toMatchObject({
      id: model.id,
      startTime: "2030-01-13T01:00:00.000Z",
      status: EventStatus.POSTPONED,
      city: null,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: model.id },
      data: {
        organizationId: undefined,
        name: undefined,
        startTime: new Date("2030-01-13T01:00:00.000Z"),
        timezone: undefined,
        status: EventStatus.POSTPONED,
        venueName: undefined,
        city: null,
        countryCode: undefined,
      },
      include: { organization: true },
    });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        actorSubject,
        action: "UPDATE",
        entityType: "EVENT",
        entityId: model.id,
      },
    });
  });

  it("rejects an update without fields before opening a transaction", async () => {
    const transaction = jest.fn();
    const prisma = { $transaction: transaction } as unknown as PrismaService;
    const service = new AdminEventsService(prisma);

    await expect(service.update(model.id, {}, actorSubject)).rejects.toThrow(
      BadRequestException,
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it("reports an unknown event during update as not found", async () => {
    const notFoundError = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      { code: "P2025", clientVersion: "7.10.0" },
    );
    const prisma = prismaWithTransaction({
      event: { update: jest.fn().mockRejectedValue(notFoundError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminEventsService(prisma);

    await expect(
      service.update(model.id, { name: model.name }, actorSubject),
    ).rejects.toThrow("Event not found");
  });

  it("reports an unknown organization during update as not found", async () => {
    const foreignKeyError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      {
        code: "P2003",
        clientVersion: "7.10.0",
        meta: { field_name: "Event_organizationId_fkey" },
      },
    );
    const prisma = prismaWithTransaction({
      event: { update: jest.fn().mockRejectedValue(foreignKeyError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminEventsService(prisma);

    await expect(
      service.update(
        model.id,
        { organizationId: organization.id },
        actorSubject,
      ),
    ).rejects.toThrow("Organization not found");
  });

  it("removes an event with its card and audits the event", async () => {
    const remove = jest.fn().mockResolvedValue(model);
    const createAuditLog = jest.fn().mockResolvedValue({});
    const prisma = prismaWithTransaction({
      event: { delete: remove },
      adminAuditLog: { create: createAuditLog },
    });
    const service = new AdminEventsService(prisma);

    await expect(
      service.remove(model.id, actorSubject),
    ).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith({ where: { id: model.id } });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        actorSubject,
        action: "DELETE",
        entityType: "EVENT",
        entityId: model.id,
      },
    });
  });

  it("reports an unknown event during removal as not found", async () => {
    const notFoundError = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      { code: "P2025", clientVersion: "7.10.0" },
    );
    const prisma = prismaWithTransaction({
      event: { delete: jest.fn().mockRejectedValue(notFoundError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminEventsService(prisma);

    await expect(service.remove(model.id, actorSubject)).rejects.toThrow(
      NotFoundException,
    );
  });

  it("does not hide unexpected database errors during removal", async () => {
    const databaseError = new Error("database unavailable");
    const prisma = prismaWithTransaction({
      event: { delete: jest.fn().mockRejectedValue(databaseError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminEventsService(prisma);

    await expect(service.remove(model.id, actorSubject)).rejects.toBe(
      databaseError,
    );
  });

  it("fails event removal when its audit record cannot be written", async () => {
    const auditError = new Error("audit unavailable");
    const prisma = prismaWithTransaction({
      event: { delete: jest.fn().mockResolvedValue(model) },
      adminAuditLog: { create: jest.fn().mockRejectedValue(auditError) },
    });
    const service = new AdminEventsService(prisma);

    await expect(service.remove(model.id, actorSubject)).rejects.toBe(
      auditError,
    );
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
