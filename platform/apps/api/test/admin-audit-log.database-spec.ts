import { Test } from "@nestjs/testing";
import { AppModule } from "../src/app.module";
import { PrismaService } from "../src/infrastructure/database/prisma.service";

describe("Administrative audit log database constraints", () => {
  let prisma: PrismaService;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    prisma = moduleRef.get(PrismaService);
  });

  afterAll(async () => prisma?.$disconnect());

  it.each(["update", "delete", "truncate"] as const)(
    "rejects %s operations on audit records",
    async (operation) => {
      await expect(
        prisma.$transaction(async (transaction) => {
          const auditLog = await transaction.adminAuditLog.create({
            data: {
              actorSubject: "integration-test-subject",
              action: "CREATE",
              entityType: "EVENT",
              entityId: "01990000-0000-7000-8000-000000000101",
            },
          });

          if (operation === "update") {
            await transaction.adminAuditLog.update({
              where: { id: auditLog.id },
              data: { action: "UPDATE" },
            });
          } else if (operation === "delete") {
            await transaction.adminAuditLog.delete({
              where: { id: auditLog.id },
            });
          } else {
            await transaction.$executeRaw`TRUNCATE TABLE "AdminAuditLog"`;
          }
        }),
      ).rejects.toThrow("AdminAuditLog is append-only");
    },
  );
});
