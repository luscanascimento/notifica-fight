import { NotFoundException } from "@nestjs/common";
import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { EventsController } from "../src/modules/events/events.controller";
import { EventsService } from "../src/modules/events/events.service";

describe("Upcoming events endpoint", () => {
  let app: INestApplication;
  const findUpcoming = jest.fn();
  const findById = jest.fn();
  const findCardByEventId = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        {
          provide: EventsService,
          useValue: { findUpcoming, findById, findCardByEventId },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    await app.init();
  });

  afterAll(async () => app.close());

  beforeEach(() => {
    findUpcoming.mockReset();
    findById.mockReset();
    findCardByEventId.mockReset();
  });

  it("GET /v1/events/upcoming returns the public response contract", async () => {
    const events = [
      {
        id: "01990000-0000-7000-8000-000000000101",
        name: "[DEV] Example Event",
        startTime: "2030-01-12T23:00:00.000Z",
        timezone: "America/New_York",
        status: "SCHEDULED",
        venueName: null,
        city: "Example City",
        countryCode: "US",
        organization: {
          id: "01990000-0000-7000-8000-000000000001",
          code: "UFC",
          name: "UFC",
        },
      },
    ];
    findUpcoming.mockResolvedValue(events);

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .get("/v1/events/upcoming")
      .expect(200);

    expect(response.body).toEqual(events);
  });

  it("returns an empty array when no future events exist", async () => {
    findUpcoming.mockResolvedValue([]);

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .get("/v1/events/upcoming")
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it("GET /v1/events/:id returns the public response contract", async () => {
    const event = {
      id: "01990000-0000-7000-8000-000000000101",
      name: "[DEV] Example Event",
      startTime: "2030-01-12T23:00:00.000Z",
      timezone: "America/New_York",
      status: "SCHEDULED",
      venueName: null,
      city: "Example City",
      countryCode: "US",
      organization: {
        id: "01990000-0000-7000-8000-000000000001",
        code: "UFC",
        name: "UFC",
      },
    };
    findById.mockResolvedValue(event);

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .get(`/v1/events/${event.id}`)
      .expect(200);

    expect(response.body).toEqual(event);
    expect(findById).toHaveBeenCalledWith(event.id);
  });

  it("rejects an invalid event ID", async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).get("/v1/events/not-a-uuid").expect(400);

    expect(findById).not.toHaveBeenCalled();
  });

  it("returns not found when the event does not exist", async () => {
    findById.mockRejectedValue(new NotFoundException("Event not found"));
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get("/v1/events/01990000-0000-7000-8000-000000000999")
      .expect(404);
  });

  it("GET /v1/events/:id/card returns the ordered public contract", async () => {
    const eventId = "01990000-0000-7000-8000-000000000101";
    const fights = [
      {
        id: "01990000-0000-7000-8000-000000000201",
        eventId,
        cardPosition: 1,
        redCornerName: "[DEV] Alex North",
        blueCornerName: "[DEV] Jordan Vale",
        weightClass: "Lightweight",
        isTitleFight: true,
      },
    ];
    findCardByEventId.mockResolvedValue(fights);

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .get(`/v1/events/${eventId}/card`)
      .expect(200);

    expect(response.body).toEqual(fights);
    expect(findCardByEventId).toHaveBeenCalledWith(eventId);
  });

  it("returns an empty card for an event without announced fights", async () => {
    const eventId = "01990000-0000-7000-8000-000000000101";
    findCardByEventId.mockResolvedValue([]);

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server)
      .get(`/v1/events/${eventId}/card`)
      .expect(200);

    expect(response.body).toEqual([]);
  });

  it("rejects an invalid event ID when reading a card", async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).get("/v1/events/not-a-uuid/card").expect(400);

    expect(findCardByEventId).not.toHaveBeenCalled();
  });

  it("returns not found when the card event does not exist", async () => {
    findCardByEventId.mockRejectedValue(
      new NotFoundException("Event not found"),
    );
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get("/v1/events/01990000-0000-7000-8000-000000000999/card")
      .expect(404);
  });
});
