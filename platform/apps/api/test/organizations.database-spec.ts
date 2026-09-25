import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AppModule } from "../src/app.module";

describe("Organizations database integration", () => {
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

  it("reads seeded organizations in name order", async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server).get("/v1/organizations").expect(200);

    expect(response.body).toEqual([
      {
        id: "01990000-0000-7000-8000-000000000002",
        code: "ONE",
        name: "ONE Championship",
      },
      {
        id: "01990000-0000-7000-8000-000000000003",
        code: "RWS",
        name: "RWS",
      },
      {
        id: "01990000-0000-7000-8000-000000000001",
        code: "UFC",
        name: "UFC",
      },
    ]);
  });
});
