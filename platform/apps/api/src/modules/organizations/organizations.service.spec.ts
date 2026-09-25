import type { Organization } from "../../generated/prisma/client";
import type { PrismaService } from "../../infrastructure/database/prisma.service";
import { OrganizationsService } from "./organizations.service";

describe("OrganizationsService", () => {
  it("returns mapped organizations in database order", async () => {
    const now = new Date("2026-09-25T12:00:00.000Z");
    const model: Organization = {
      id: "01990000-0000-7000-8000-000000000002",
      code: "ONE",
      name: "ONE Championship",
      createdAt: now,
      updatedAt: now,
    };
    const findMany = jest.fn().mockResolvedValue([model]);
    const prisma = { organization: { findMany } } as unknown as PrismaService;
    const service = new OrganizationsService(prisma);

    await expect(service.findAll()).resolves.toEqual([
      {
        id: model.id,
        code: model.code,
        name: model.name,
      },
    ]);
    expect(findMany).toHaveBeenCalledWith({ orderBy: { name: "asc" } });
  });
});
