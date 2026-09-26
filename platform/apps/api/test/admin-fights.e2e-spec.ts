import { ValidationPipe } from "@nestjs/common";
import type { ExecutionContext, INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AdminFightsController } from "../src/modules/admin/admin-fights.controller";
import { AdminFightsService } from "../src/modules/admin/admin-fights.service";
import { AdminAuthGuard } from "../src/modules/admin/auth/admin-auth.guard";
import type { AdminRequest } from "../src/modules/admin/auth/admin-principal";

describe("Administrative fights endpoint", () => {
  let app: INestApplication;
  const create = jest.fn();

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AdminFightsController],
      providers: [{ provide: AdminFightsService, useValue: { create } }],
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

  it("POST /v1/admin/events/:eventId/fights creates a normalized fight", async () => {
    const eventId = "01990000-0000-7000-8000-000000000101";
    const fight = {
      id: "01990000-0000-7000-8000-000000000205",
      eventId,
      cardPosition: 3,
      redCornerName: "[DEV] Taylor North",
      blueCornerName: "[DEV] Cameron Vale",
      weightClass: "Lightweight",
      isTitleFight: false,
    };
    create.mockResolvedValue(fight);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post(`/v1/admin/events/${eventId}/fights`)
      .send({
        cardPosition: 3,
        redCornerName: " [DEV] Taylor North ",
        blueCornerName: " [DEV] Cameron Vale ",
        weightClass: " Lightweight ",
      })
      .expect(201);

    expect(response.body).toEqual(fight);
    expect(create).toHaveBeenCalledWith(
      eventId,
      {
        cardPosition: 3,
        redCornerName: "[DEV] Taylor North",
        blueCornerName: "[DEV] Cameron Vale",
        weightClass: "Lightweight",
      },
      "admin-test-subject",
    );
  });

  it("rejects an invalid event ID", async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post("/v1/admin/events/not-a-uuid/fights")
      .send(validFight())
      .expect(400);

    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    [{ ...validFight(), cardPosition: 0 }],
    [{ ...validFight(), cardPosition: 1.5 }],
    [{ ...validFight(), redCornerName: "" }],
    [{ ...validFight(), blueCornerName: " " }],
    [{ ...validFight(), weightClass: " " }],
    [{ ...validFight(), isTitleFight: "false" }],
    [{ ...validFight(), unexpected: true }],
  ])("rejects invalid fight data %#", async (body) => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post("/v1/admin/events/01990000-0000-7000-8000-000000000101/fights")
      .send(body)
      .expect(400);

    expect(create).not.toHaveBeenCalled();
  });

  function validFight(): Record<string, unknown> {
    return {
      cardPosition: 3,
      redCornerName: "[DEV] Taylor North",
      blueCornerName: "[DEV] Cameron Vale",
    };
  }
});
