import { ConflictException, NotFoundException } from "@nestjs/common";
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
