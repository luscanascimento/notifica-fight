import { ConflictException } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { randomUUID } from "node:crypto";
import type { Prisma } from "../src/generated/prisma/client";
import { EventStatus } from "../src/generated/prisma/enums";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/infrastructure/database/prisma.service";
import { AdminEventsService } from "../src/modules/admin/admin-events.service";
import { AdminFightsService } from "../src/modules/admin/admin-fights.service";
import { AdminOrganizationsService } from "../src/modules/admin/admin-organizations.service";

class RollbackIntegrationTest extends Error {}

describe("Administrative mutations database integration", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => prisma?.$disconnect());

  it("persists the audited lifecycle and cascades an event card", async () => {
    const actorSubject = `integration-test-${randomUUID()}`;
    const code = integrationOrganizationCode();

    await expect(
      prisma.$transaction(async (transaction) => {
        const services = servicesFor(transaction);
        const organization = await services.organizations.create(
          { code, name: "[DEV] Integration Organization" },
          actorSubject,
        );
        await services.organizations.update(
          organization.id,
          { name: "[DEV] Updated Integration Organization" },
          actorSubject,
        );

        const event = await services.events.create(
          {
            organizationId: organization.id,
            name: "[DEV] Integration Event",
            startTime: "2030-01-12T23:00:00.000Z",
            timezone: "America/Sao_Paulo",
          },
          actorSubject,
        );
        await services.events.update(
          event.id,
          { status: EventStatus.POSTPONED },
          actorSubject,
        );

        const removedFight = await services.fights.create(
          event.id,
          {
            cardPosition: 1,
            redCornerName: "[DEV] Red Corner One",
            blueCornerName: "[DEV] Blue Corner One",
          },
          actorSubject,
        );
        await services.fights.update(
          event.id,
          removedFight.id,
          { isTitleFight: true },
          actorSubject,
        );
        await services.fights.remove(
          event.id,
          removedFight.id,
          actorSubject,
        );

        const cascadedFight = await services.fights.create(
          event.id,
          {
            cardPosition: 2,
            redCornerName: "[DEV] Red Corner Two",
            blueCornerName: "[DEV] Blue Corner Two",
          },
          actorSubject,
        );
        await services.events.remove(event.id, actorSubject);

        await expect(
          transaction.event.findUnique({ where: { id: event.id } }),
        ).resolves.toBeNull();
        await expect(
          transaction.fight.findUnique({ where: { id: removedFight.id } }),
        ).resolves.toBeNull();
        await expect(
          transaction.fight.findUnique({ where: { id: cascadedFight.id } }),
        ).resolves.toBeNull();
        await services.organizations.remove(organization.id, actorSubject);
        await expect(
          transaction.organization.findUnique({
            where: { id: organization.id },
          }),
        ).resolves.toBeNull();

        const auditEntries = await transaction.adminAuditLog.findMany({
          where: { actorSubject },
          select: { action: true, entityType: true, entityId: true },
        });
        expect(auditEntries).toHaveLength(10);
        expect(auditEntries).toEqual(
          expect.arrayContaining([
            auditEntry("CREATE", "ORGANIZATION", organization.id),
            auditEntry("UPDATE", "ORGANIZATION", organization.id),
            auditEntry("DELETE", "ORGANIZATION", organization.id),
            auditEntry("CREATE", "EVENT", event.id),
            auditEntry("UPDATE", "EVENT", event.id),
            auditEntry("DELETE", "EVENT", event.id),
            auditEntry("CREATE", "FIGHT", removedFight.id),
            auditEntry("UPDATE", "FIGHT", removedFight.id),
            auditEntry("DELETE", "FIGHT", removedFight.id),
            auditEntry("CREATE", "FIGHT", cascadedFight.id),
          ]),
        );

        throw new RollbackIntegrationTest();
      }),
    ).rejects.toThrow(RollbackIntegrationTest);
    await expect(
      prisma.adminAuditLog.count({ where: { actorSubject } }),
    ).resolves.toBe(0);
  });

  it("rejects removing an organization that still has an event", async () => {
    const actorSubject = `integration-test-${randomUUID()}`;

    await expect(
      prisma.$transaction(async (transaction) => {
        const services = servicesFor(transaction);
        const organization = await services.organizations.create(
          {
            code: integrationOrganizationCode(),
            name: "[DEV] Linked Integration Organization",
          },
          actorSubject,
        );
        await services.events.create(
          {
            organizationId: organization.id,
            name: "[DEV] Linked Integration Event",
            startTime: "2030-01-12T23:00:00.000Z",
            timezone: "America/Sao_Paulo",
          },
          actorSubject,
        );

        await services.organizations.remove(organization.id, actorSubject);
      }),
    ).rejects.toThrow(ConflictException);
    await expect(
      prisma.adminAuditLog.count({ where: { actorSubject } }),
    ).resolves.toBe(0);
  });

  function servicesFor(transaction: Prisma.TransactionClient): {
    organizations: AdminOrganizationsService;
    events: AdminEventsService;
    fights: AdminFightsService;
  } {
    const transactionalPrisma = {
      $transaction: (
        operation: (client: Prisma.TransactionClient) => Promise<unknown>,
      ): Promise<unknown> => operation(transaction),
    } as PrismaService;

    return {
      organizations: new AdminOrganizationsService(transactionalPrisma),
      events: new AdminEventsService(transactionalPrisma),
      fights: new AdminFightsService(transactionalPrisma),
    };
  }

  function integrationOrganizationCode(): string {
    return `IT-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  }

  function auditEntry(
    action: "CREATE" | "DELETE" | "UPDATE",
    entityType: "EVENT" | "FIGHT" | "ORGANIZATION",
    entityId: string,
  ): { action: string; entityType: string; entityId: string } {
    return { action, entityType, entityId };
  }
});
