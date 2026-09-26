import { BadRequestException, ValidationPipe } from "@nestjs/common";
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
  const remove = jest.fn();
  const update = jest.fn();

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [AdminFightsController],
      providers: [
        { provide: AdminFightsService, useValue: { create, remove, update } },
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
    remove.mockReset();
    update.mockReset();
  });

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

  it("PATCH /v1/admin/events/:eventId/fights/:fightId updates a fight", async () => {
    const eventId = "01990000-0000-7000-8000-000000000101";
    const fightId = "01990000-0000-7000-8000-000000000205";
    const fight = {
      id: fightId,
      eventId,
      cardPosition: 4,
      redCornerName: "[DEV] Taylor North",
      blueCornerName: "[DEV] Cameron Vale",
      weightClass: null,
      isTitleFight: true,
    };
    update.mockResolvedValue(fight);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .patch(`/v1/admin/events/${eventId}/fights/${fightId}`)
      .send({
        cardPosition: 4,
        weightClass: null,
        isTitleFight: true,
      })
      .expect(200);

    expect(response.body).toEqual(fight);
    expect(update).toHaveBeenCalledWith(
      eventId,
      fightId,
      { cardPosition: 4, weightClass: null, isTitleFight: true },
      "admin-test-subject",
    );
  });

  it.each([
    [
      "not-a-uuid",
      "01990000-0000-7000-8000-000000000205",
      { cardPosition: 4 },
    ],
    [
      "01990000-0000-7000-8000-000000000101",
      "not-a-uuid",
      { cardPosition: 4 },
    ],
    [
      "01990000-0000-7000-8000-000000000101",
      "01990000-0000-7000-8000-000000000205",
      { cardPosition: 0 },
    ],
    [
      "01990000-0000-7000-8000-000000000101",
      "01990000-0000-7000-8000-000000000205",
      { unexpected: true },
    ],
  ])(
    "rejects invalid fight updates %#",
    async (eventId, fightId, body) => {
      const server = app.getHttpServer() as Parameters<typeof request>[0];

      await request(server)
        .patch(`/v1/admin/events/${eventId}/fights/${fightId}`)
        .send(body)
        .expect(400);

      expect(update).not.toHaveBeenCalled();
    },
  );

  it("rejects a fight update without fields", async () => {
    const eventId = "01990000-0000-7000-8000-000000000101";
    const fightId = "01990000-0000-7000-8000-000000000205";
    update.mockRejectedValue(
      new BadRequestException("At least one fight field is required"),
    );
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .patch(`/v1/admin/events/${eventId}/fights/${fightId}`)
      .send({})
      .expect(400);

    expect(update).toHaveBeenCalledWith(
      eventId,
      fightId,
      {},
      "admin-test-subject",
    );
  });

  it("DELETE /v1/admin/events/:eventId/fights/:fightId removes a fight", async () => {
    const eventId = "01990000-0000-7000-8000-000000000101";
    const fightId = "01990000-0000-7000-8000-000000000205";
    remove.mockResolvedValue(undefined);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .delete(`/v1/admin/events/${eventId}/fights/${fightId}`)
      .expect(204);

    expect(response.body).toEqual({});
    expect(remove).toHaveBeenCalledWith(
      eventId,
      fightId,
      "admin-test-subject",
    );
  });

  it.each([
    ["not-a-uuid", "01990000-0000-7000-8000-000000000205"],
    ["01990000-0000-7000-8000-000000000101", "not-a-uuid"],
  ])("rejects invalid fight removals %#", async (eventId, fightId) => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .delete(`/v1/admin/events/${eventId}/fights/${fightId}`)
      .expect(400);

    expect(remove).not.toHaveBeenCalled();
  });

  function validFight(): Record<string, unknown> {
    return {
      cardPosition: 3,
      redCornerName: "[DEV] Taylor North",
      blueCornerName: "[DEV] Cameron Vale",
    };
  }
});
