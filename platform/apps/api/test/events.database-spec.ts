import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Upcoming events database integration", () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    await app.init();
  });

  afterAll(async () => app.close());

  it("reads seeded future events through the public endpoint", async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server).get("/v1/events/upcoming").expect(200);
    const body = response.body as unknown;

    expect(Array.isArray(body)).toBe(true);
    expect(body).toHaveLength(3);
    expect(JSON.stringify(body)).toContain('"name":"[DEV] ');
    expect(JSON.stringify(body)).toContain('"code":"UFC"');
  });
});
