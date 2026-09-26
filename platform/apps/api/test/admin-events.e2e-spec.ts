import { BadRequestException, ValidationPipe } from "@nestjs/common";
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
  const update = jest.fn();

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AdminEventsController],
      providers: [{ provide: AdminEventsService, useValue: { create, update } }],
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

  it("PATCH /v1/admin/events/:eventId updates normalized fields", async () => {
    const eventId = "01990000-0000-7000-8000-000000000104";
    const event = {
      id: eventId,
      name: "[DEV] Updated Event",
      startTime: "2030-01-13T01:00:00.000Z",
      timezone: "America/New_York",
      status: EventStatus.POSTPONED,
      venueName: null,
      city: null,
      countryCode: "US",
      organization: {
        id: "01990000-0000-7000-8000-000000000001",
        code: "UFC",
        name: "UFC",
      },
    };
    update.mockResolvedValue(event);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .patch(`/v1/admin/events/${eventId}`)
      .send({
        name: " [DEV] Updated Event ",
        startTime: "2030-01-12T20:00:00.000-05:00",
        status: EventStatus.POSTPONED,
        city: null,
        countryCode: " us ",
      })
      .expect(200);

    expect(response.body).toEqual(event);
    expect(update).toHaveBeenCalledWith(
      eventId,
      {
        name: "[DEV] Updated Event",
        startTime: "2030-01-12T20:00:00.000-05:00",
        status: EventStatus.POSTPONED,
        city: null,
        countryCode: "US",
      },
      "admin-test-subject",
    );
  });

  it.each([
    ["not-a-uuid", { status: EventStatus.CANCELED }],
    ["01990000-0000-7000-8000-000000000104", { status: "UNKNOWN" }],
    ["01990000-0000-7000-8000-000000000104", { unexpected: true }],
  ])("rejects invalid event updates %#", async (eventId, body) => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .patch(`/v1/admin/events/${eventId}`)
      .send(body)
      .expect(400);

    expect(update).not.toHaveBeenCalled();
  });

  it("rejects an event update without fields", async () => {
    const eventId = "01990000-0000-7000-8000-000000000104";
    update.mockRejectedValue(
      new BadRequestException("At least one event field is required"),
    );
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .patch(`/v1/admin/events/${eventId}`)
      .send({})
      .expect(400);

    expect(update).toHaveBeenCalledWith(eventId, {}, "admin-test-subject");
  });
});
