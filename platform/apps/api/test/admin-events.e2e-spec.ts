import { ValidationPipe } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import type { ExecutionContext } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { EventStatus } from "../src/generated/prisma/enums";
import { AdminEventsController } from "../src/modules/admin/admin-events.controller";
import { AdminEventsService } from "../src/modules/admin/admin-events.service";
import { AdminAuthGuard } from "../src/modules/admin/auth/admin-auth.guard";
import type { AdminRequest } from "../src/modules/admin/auth/admin-principal";

describe("Administrative events endpoint", () => {
  let app: INestApplication;
  const create = jest.fn();

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AdminEventsController],
      providers: [{ provide: AdminEventsService, useValue: { create } }],
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

  beforeEach(() => create.mockReset());

  it("POST /v1/admin/events creates a normalized event", async () => {
    const organizationId = "01990000-0000-7000-8000-000000000001";
    const event = {
      id: "01990000-0000-7000-8000-000000000104",
      name: "[DEV] Example Event",
      startTime: "2030-01-12T23:00:00.000Z",
      timezone: "America/New_York",
      status: EventStatus.SCHEDULED,
      venueName: "Development Arena",
      city: "Example City",
      countryCode: "US",
      organization: { id: organizationId, code: "UFC", name: "UFC" },
    };
    create.mockResolvedValue(event);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post("/v1/admin/events")
      .send({
        organizationId,
        name: " [DEV] Example Event ",
        startTime: "2030-01-12T18:00:00.000-05:00",
        timezone: " America/New_York ",
        venueName: " Development Arena ",
        city: " Example City ",
        countryCode: " us ",
      })
      .expect(201);

    expect(response.body).toEqual(event);
    expect(create).toHaveBeenCalledWith(
      {
        organizationId,
        name: "[DEV] Example Event",
        startTime: "2030-01-12T18:00:00.000-05:00",
        timezone: "America/New_York",
        venueName: "Development Arena",
        city: "Example City",
        countryCode: "US",
      },
      "admin-test-subject",
    );
  });

  it.each([
    [
      {
        organizationId: "not-a-uuid",
        name: "[DEV] Example Event",
        startTime: "2030-01-12T23:00:00.000Z",
        timezone: "America/New_York",
      },
    ],
    [
      {
        organizationId: "01990000-0000-7000-8000-000000000001",
        name: "",
        startTime: "2030-01-12T23:00:00.000Z",
        timezone: "America/New_York",
      },
    ],
    [
      {
        organizationId: "01990000-0000-7000-8000-000000000001",
        name: "[DEV] Example Event",
        startTime: "2030-01-12T23:00:00",
        timezone: "America/New_York",
      },
    ],
    [
      {
        organizationId: "01990000-0000-7000-8000-000000000001",
        name: "[DEV] Example Event",
        startTime: "2030-01-12T23:00:00.000Z",
        timezone: "Mars/Olympus_Mons",
      },
    ],
    [
      {
        organizationId: "01990000-0000-7000-8000-000000000001",
        name: "[DEV] Example Event",
        startTime: "2030-01-12T23:00:00.000Z",
        timezone: "America/New_York",
        countryCode: "XX",
      },
    ],
    [
      {
        organizationId: "01990000-0000-7000-8000-000000000001",
        name: "[DEV] Example Event",
        startTime: "2030-01-12T23:00:00.000Z",
        timezone: "America/New_York",
        unexpected: true,
      },
    ],
  ])("rejects invalid input %#", async (body) => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).post("/v1/admin/events").send(body).expect(400);

    expect(create).not.toHaveBeenCalled();
  });
});
