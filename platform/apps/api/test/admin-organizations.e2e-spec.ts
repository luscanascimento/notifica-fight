import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AdminOrganizationsController } from "../src/modules/admin/admin-organizations.controller";
import { AdminOrganizationsService } from "../src/modules/admin/admin-organizations.service";
import { AdminAuthGuard } from "../src/modules/admin/auth/admin-auth.guard";

describe("Administrative organizations endpoint", () => {
  let app: INestApplication;
  const create = jest.fn();

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AdminOrganizationsController],
      providers: [
        { provide: AdminOrganizationsService, useValue: { create } },
      ],
    });
    const moduleRef = await moduleBuilder
      .overrideGuard(AdminAuthGuard)
      .useValue({ canActivate: () => true })
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

  beforeEach(() => create.mockReset());

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
    expect(create).toHaveBeenCalledWith({
      code: "PFL",
      name: "Professional Fighters League",
    });
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
});
