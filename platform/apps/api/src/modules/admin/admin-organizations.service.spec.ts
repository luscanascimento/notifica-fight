import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import type { Organization } from "../../generated/prisma/client";
import type { PrismaService } from "../../infrastructure/database/prisma.service";
import { AdminOrganizationsService } from "./admin-organizations.service";

describe("AdminOrganizationsService", () => {
  const actorSubject = "admin-test-subject";
  const now = new Date("2026-09-26T12:00:00.000Z");
  const model: Organization = {
    id: "01990000-0000-7000-8000-000000000004",
    code: "PFL",
    name: "Professional Fighters League",
    createdAt: now,
    updatedAt: now,
  };

  it("creates and maps an organization", async () => {
    const create = jest.fn().mockResolvedValue(model);
    const createAuditLog = jest.fn().mockResolvedValue({});
    const prisma = prismaWithTransaction({
      organization: { create },
      adminAuditLog: { create: createAuditLog },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.create({ code: model.code, name: model.name }, actorSubject),
    ).resolves.toEqual({ id: model.id, code: model.code, name: model.name });
    expect(create).toHaveBeenCalledWith({
      data: { code: model.code, name: model.name },
    });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        actorSubject,
        action: "CREATE",
        entityType: "ORGANIZATION",
        entityId: model.id,
      },
    });
  });

  it("reports duplicate organization codes as a conflict", async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "7.10.0",
        meta: { target: ["code"] },
      },
    );
    const create = jest.fn().mockRejectedValue(duplicateError);
    const prisma = prismaWithTransaction({
      organization: { create },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.create({ code: model.code, name: model.name }, actorSubject),
    ).rejects.toThrow(ConflictException);
  });

  it("does not hide unexpected database errors", async () => {
    const databaseError = new Error("database unavailable");
    const create = jest.fn().mockRejectedValue(databaseError);
    const prisma = prismaWithTransaction({
      organization: { create },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.create({ code: model.code, name: model.name }, actorSubject),
    ).rejects.toBe(databaseError);
  });

  it("fails the transaction when the audit record cannot be written", async () => {
    const auditError = new Error("audit unavailable");
    const prisma = prismaWithTransaction({
      organization: { create: jest.fn().mockResolvedValue(model) },
      adminAuditLog: { create: jest.fn().mockRejectedValue(auditError) },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.create({ code: model.code, name: model.name }, actorSubject),
    ).rejects.toBe(auditError);
  });

  it("updates and maps an organization", async () => {
    const updatedModel = {
      ...model,
      code: "ONE",
      name: "One Championship",
    };
    const update = jest.fn().mockResolvedValue(updatedModel);
    const createAuditLog = jest.fn().mockResolvedValue({});
    const prisma = prismaWithTransaction({
      organization: { update },
      adminAuditLog: { create: createAuditLog },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.update(
        model.id,
        { code: updatedModel.code, name: updatedModel.name },
        actorSubject,
      ),
    ).resolves.toEqual({
      id: model.id,
      code: updatedModel.code,
      name: updatedModel.name,
    });
    expect(update).toHaveBeenCalledWith({
      where: { id: model.id },
      data: { code: updatedModel.code, name: updatedModel.name },
    });
    expect(createAuditLog).toHaveBeenCalledWith({
      data: {
        actorSubject,
        action: "UPDATE",
        entityType: "ORGANIZATION",
        entityId: model.id,
      },
    });
  });

  it("rejects an empty organization update", async () => {
    const transaction = jest.fn();
    const prisma = { $transaction: transaction } as unknown as PrismaService;
    const service = new AdminOrganizationsService(prisma);

    await expect(service.update(model.id, {}, actorSubject)).rejects.toThrow(
      BadRequestException,
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it("reports a missing organization during update", async () => {
    const notFoundError = new Prisma.PrismaClientKnownRequestError(
      "Record not found",
      { code: "P2025", clientVersion: "7.10.0" },
    );
    const prisma = prismaWithTransaction({
      organization: { update: jest.fn().mockRejectedValue(notFoundError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.update(model.id, { name: "Updated name" }, actorSubject),
    ).rejects.toThrow(NotFoundException);
  });

  it("reports duplicate organization codes during update as a conflict", async () => {
    const duplicateError = new Prisma.PrismaClientKnownRequestError(
      "Unique constraint failed",
      {
        code: "P2002",
        clientVersion: "7.10.0",
        meta: { target: ["code"] },
      },
    );
    const prisma = prismaWithTransaction({
      organization: { update: jest.fn().mockRejectedValue(duplicateError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.update(model.id, { code: "ONE" }, actorSubject),
    ).rejects.toThrow(ConflictException);
  });

  it("does not hide unexpected database errors during update", async () => {
    const databaseError = new Error("database unavailable");
    const prisma = prismaWithTransaction({
      organization: { update: jest.fn().mockRejectedValue(databaseError) },
      adminAuditLog: { create: jest.fn() },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.update(model.id, { name: "Updated name" }, actorSubject),
    ).rejects.toBe(databaseError);
  });

  it("fails an organization update when its audit record cannot be written", async () => {
    const auditError = new Error("audit unavailable");
    const prisma = prismaWithTransaction({
      organization: { update: jest.fn().mockResolvedValue(model) },
      adminAuditLog: { create: jest.fn().mockRejectedValue(auditError) },
    });
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.update(model.id, { name: "Updated name" }, actorSubject),
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
