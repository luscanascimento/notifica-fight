import { BadRequestException, ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AdminOrganizationsController } from "../src/modules/admin/admin-organizations.controller";
import { AdminOrganizationsService } from "../src/modules/admin/admin-organizations.service";
import { AdminAuthGuard } from "../src/modules/admin/auth/admin-auth.guard";
import type { AdminRequest } from "../src/modules/admin/auth/admin-principal";

describe("Administrative organizations endpoint", () => {
  let app: INestApplication;
  const create = jest.fn();
  const update = jest.fn();

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AdminOrganizationsController],
      providers: [
        { provide: AdminOrganizationsService, useValue: { create, update } },
      ],
    });
    const moduleRef = await moduleBuilder
      .overrideGuard(AdminAuthGuard)
      .useValue({
        canActivate: (context: ExecutionContext): boolean => {
          const request = context.switchToHttp().getRequest<AdminRequest>();
          request.adminPrincipal = { subject: "admin-test-subject" };
          return true;
        },
      })
      .compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: { enableImplicitConversion: false },
      }),
    );
    await app.init();
  });

  afterAll(async () => app?.close());

  beforeEach(() => {
    create.mockReset();
    update.mockReset();
  });

  it("POST /v1/admin/organizations creates a normalized organization", async () => {
    const organization = {
      id: "01990000-0000-7000-8000-000000000004",
      code: "PFL",
      name: "Professional Fighters League",
    };
    create.mockResolvedValue(organization);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post("/v1/admin/organizations")
      .send({ code: " pfl ", name: " Professional Fighters League " })
      .expect(201);

    expect(response.body).toEqual(organization);
    expect(create).toHaveBeenCalledWith(
      { code: "PFL", name: "Professional Fighters League" },
      "admin-test-subject",
    );
  });

  it.each([
    [{ code: "", name: "Example" }],
    [{ code: "invalid code", name: "Example" }],
    [{ code: "VALID", name: "" }],
    [{ code: "VALID", name: "Example", unexpected: true }],
  ])("rejects invalid input %#", async (body) => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post("/v1/admin/organizations")
      .send(body)
      .expect(400);

    expect(create).not.toHaveBeenCalled();
  });

  it("PATCH /v1/admin/organizations/:id updates normalized fields", async () => {
    const organization = {
      id: "01990000-0000-7000-8000-000000000004",
      code: "ONE",
      name: "One Championship",
    };
    update.mockResolvedValue(organization);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .patch(`/v1/admin/organizations/${organization.id}`)
      .send({ code: " one ", name: " One Championship " })
      .expect(200);

    expect(response.body).toEqual(organization);
    expect(update).toHaveBeenCalledWith(
      organization.id,
      { code: "ONE", name: "One Championship" },
      "admin-test-subject",
    );
  });

  it.each([
    ["not-a-uuid", { name: "Example" }],
    ["01990000-0000-7000-8000-000000000004", { code: "invalid code" }],
    ["01990000-0000-7000-8000-000000000004", { unexpected: true }],
  ])("rejects invalid organization updates %#", async (organizationId, body) => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .patch(`/v1/admin/organizations/${organizationId}`)
      .send(body)
      .expect(400);

    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an organization update without fields", async () => {
    const organizationId = "01990000-0000-7000-8000-000000000004";
    update.mockRejectedValue(
      new BadRequestException("At least one organization field is required"),
    );
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .patch(`/v1/admin/organizations/${organizationId}`)
      .send({})
      .expect(400);

    expect(update).toHaveBeenCalledWith(
      organizationId,
      {},
      "admin-test-subject",
    );
  });
});
