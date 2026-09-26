import { ConflictException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import type { Organization } from "../../generated/prisma/client";
import type { PrismaService } from "../../infrastructure/database/prisma.service";
import { AdminOrganizationsService } from "./admin-organizations.service";

describe("AdminOrganizationsService", () => {
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
    const prisma = { organization: { create } } as unknown as PrismaService;
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.create({ code: model.code, name: model.name }),
    ).resolves.toEqual({ id: model.id, code: model.code, name: model.name });
    expect(create).toHaveBeenCalledWith({
      data: { code: model.code, name: model.name },
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
    const prisma = { organization: { create } } as unknown as PrismaService;
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.create({ code: model.code, name: model.name }),
    ).rejects.toThrow(ConflictException);
  });

  it("does not hide unexpected database errors", async () => {
    const databaseError = new Error("database unavailable");
    const create = jest.fn().mockRejectedValue(databaseError);
    const prisma = { organization: { create } } as unknown as PrismaService;
    const service = new AdminOrganizationsService(prisma);

    await expect(
      service.create({ code: model.code, name: model.name }),
    ).rejects.toBe(databaseError);
  });
});
