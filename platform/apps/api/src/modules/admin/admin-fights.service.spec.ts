import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import type { Fight } from "../../generated/prisma/client";
import type { PrismaService } from "../../infrastructure/database/prisma.service";
import { AdminFightsService } from "./admin-fights.service";

describe("AdminFightsService", () => {
  const actorSubject = "admin-test-subject";
  const now = new Date("2026-09-26T12:00:00.000Z");
  const model: Fight = {
    id: "01990000-0000-7000-8000-000000000205",
    eventId: "01990000-0000-7000-8000-000000000101",
    externalId: null,
    cardPosition: 3,
    redCornerName: "[DEV] Taylor North",
    blueCornerName: "[DEV] Cameron Vale",
    weightClass: null,
    isTitleFight: false,
    createdAt: now,
    updatedAt: now,
  };

  it("creates and audits a fight", async () => {
    const create = jest.fn().mockResolvedValue(model);
    const createAuditLog = jest.fn().mockResolvedValue({});
    const prisma = prismaWithTransaction({
      fight: { create },
      adminAuditLog: { create: createAuditLog },
    });
    const service = new AdminFightsService(prisma);

    await expect(
      service.create(
        model.eventId,
        {
          cardPosition: model.cardPosition,
          redCornerName: model.redCornerName,
          blueCornerName: model.blueCornerName,
        },
        actorSubject,
      ),
    ).resolves.toEqual({
      id: model.id,
      eventId: model.eventId,
      cardPosition: model.cardPosition,
      redCornerName: model.redCornerName,
      blueCornerName: model.blueCornerName,
      weightClass: null,
      isTitleFight: false,
    });
    expect(create).toHaveBeenCalledWith({
      data: {
        eventId: model.eventId,
        cardPosition: model.cardPosition,
        redCornerName: model.redCornerName,
        blueCornerName: model.blueCornerName,
        weightClass: null,
        isTitleFight: false,
      },
    });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        actorSubject,
        action: "CREATE",
        entityType: "FIGHT",
        entityId: model.id,
      },
    });
  });

  it("reports a duplicate card position as a conflict", async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "7.10.0",
        meta: { target: ["eventId", "cardPosition"] },
      },
    );
    const prisma = prismaWithTransaction({
      fight: { create: jest.fn().mockRejectedValue(duplicateError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminFightsService(prisma);

    await expect(createFight(service)).rejects.toThrow(ConflictException);
  });

  it("reports an unknown event as not found", async () => {
    const foreignKeyError = new Prisma.PrismaClientKnownRequestError(
      "Foreign key constraint failed",
      {
        code: "P2003",
        clientVersion: "7.10.0",
        meta: { field_name: "Fight_eventId_fkey" },
      },
    );
    const prisma = prismaWithTransaction({
      fight: { create: jest.fn().mockRejectedValue(foreignKeyError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminFightsService(prisma);

    await expect(createFight(service)).rejects.toThrow(NotFoundException);
  });

  it("does not hide unexpected database errors", async () => {
    const databaseError = new Error("database unavailable");
    const prisma = prismaWithTransaction({
      fight: { create: jest.fn().mockRejectedValue(databaseError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminFightsService(prisma);

    await expect(createFight(service)).rejects.toBe(databaseError);
  });

  it("fails the transaction when the audit record cannot be written", async () => {
    const auditError = new Error("audit unavailable");
    const prisma = prismaWithTransaction({
      fight: { create: jest.fn().mockResolvedValue(model) },
      adminAuditLog: { create: jest.fn().mockRejectedValue(auditError) },
    });
    const service = new AdminFightsService(prisma);

    await expect(createFight(service)).rejects.toBe(auditError);
  });

  it("updates and audits only the supplied fight fields", async () => {
    const updatedModel = {
      ...model,
      cardPosition: 4,
      weightClass: "Welterweight",
      isTitleFight: true,
    };
    const update = jest.fn().mockResolvedValue(updatedModel);
    const createAuditLog = jest.fn().mockResolvedValue({});
    const prisma = prismaWithTransaction({
      fight: { update },
      adminAuditLog: { create: createAuditLog },
    });
    const service = new AdminFightsService(prisma);

    await expect(
      service.update(
        model.eventId,
        model.id,
        {
          cardPosition: 4,
          weightClass: "Welterweight",
          isTitleFight: true,
        },
        actorSubject,
      ),
    ).resolves.toMatchObject({
      id: model.id,
      eventId: model.eventId,
      cardPosition: 4,
      weightClass: "Welterweight",
      isTitleFight: true,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: model.id, eventId: model.eventId },
      data: {
        cardPosition: 4,
        redCornerName: undefined,
        blueCornerName: undefined,
        weightClass: "Welterweight",
        isTitleFight: true,
      },
    });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        actorSubject,
        action: "UPDATE",
        entityType: "FIGHT",
        entityId: model.id,
      },
    });
  });

  it("rejects an update without fields before opening a transaction", async () => {
    const transaction = jest.fn();
    const prisma = { $transaction: transaction } as unknown as PrismaService;
    const service = new AdminFightsService(prisma);

    await expect(
      service.update(model.eventId, model.id, {}, actorSubject),
    ).rejects.toThrow(BadRequestException);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("reports a conflicting card position during update", async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "7.10.0",
        meta: { target: ["eventId", "cardPosition"] },
      },
    );
    const prisma = prismaWithTransaction({
      fight: { update: jest.fn().mockRejectedValue(duplicateError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminFightsService(prisma);

    await expect(
      service.update(
        model.eventId,
        model.id,
        { cardPosition: 1 },
        actorSubject,
      ),
    ).rejects.toThrow(ConflictException);
  });

  it("does not update a fight through a different event", async () => {
    const notFoundError = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      { code: "P2025", clientVersion: "7.10.0" },
    );
    const prisma = prismaWithTransaction({
      fight: { update: jest.fn().mockRejectedValue(notFoundError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminFightsService(prisma);

    await expect(
      service.update(
        model.eventId,
        model.id,
        { redCornerName: "[DEV] Updated Fighter" },
        actorSubject,
      ),
    ).rejects.toThrow("Fight not found for this event");
  });

  it("removes and audits a fight that belongs to the event", async () => {
    const remove = jest.fn().mockResolvedValue(model);
    const createAuditLog = jest.fn().mockResolvedValue({});
    const prisma = prismaWithTransaction({
      fight: { delete: remove },
      adminAuditLog: { create: createAuditLog },
    });
    const service = new AdminFightsService(prisma);

    await expect(
      service.remove(model.eventId, model.id, actorSubject),
    ).resolves.toBeUndefined();
    expect(remove).toHaveBeenCalledWith({
      where: { id: model.id, eventId: model.eventId },
    });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        actorSubject,
        action: "DELETE",
        entityType: "FIGHT",
        entityId: model.id,
      },
    });
  });

  it("does not remove a fight through a different event", async () => {
    const notFoundError = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      { code: "P2025", clientVersion: "7.10.0" },
    );
    const prisma = prismaWithTransaction({
      fight: { delete: jest.fn().mockRejectedValue(notFoundError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminFightsService(prisma);

    await expect(
      service.remove(model.eventId, model.id, actorSubject),
    ).rejects.toThrow("Fight not found for this event");
  });

  it("does not hide unexpected errors while removing a fight", async () => {
    const databaseError = new Error("database unavailable");
    const prisma = prismaWithTransaction({
      fight: { delete: jest.fn().mockRejectedValue(databaseError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminFightsService(prisma);

    await expect(
      service.remove(model.eventId, model.id, actorSubject),
    ).rejects.toBe(databaseError);
  });

  it("fails fight removal when the audit record cannot be written", async () => {
    const auditError = new Error("audit unavailable");
    const prisma = prismaWithTransaction({
      fight: { delete: jest.fn().mockResolvedValue(model) },
      adminAuditLog: { create: jest.fn().mockRejectedValue(auditError) },
    });
    const service = new AdminFightsService(prisma);

    await expect(
      service.remove(model.eventId, model.id, actorSubject),
    ).rejects.toBe(auditError);
  });

  function createFight(service: AdminFightsService): Promise<unknown> {
    return service.create(
      model.eventId,
      {
        cardPosition: model.cardPosition,
        redCornerName: model.redCornerName,
        blueCornerName: model.blueCornerName,
      },
      actorSubject,
    );
  }

  function prismaWithTransaction(transaction: object): PrismaService {
    return {
      $transaction: jest.fn(
        (operation: (client: Prisma.TransactionClient) => Promise<unknown>) =>
          operation(transaction as Prisma.TransactionClient),
      ),
    } as unknown as PrismaService;
  }
});
