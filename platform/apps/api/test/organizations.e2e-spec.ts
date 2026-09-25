import type { INestApplication } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { OrganizationsController } from "../src/modules/organizations/organizations.controller";
import { OrganizationsService } from "../src/modules/organizations/organizations.service";

describe("Organizations endpoint", () => {
  let app: INestApplication;
  const findAll = jest.fn();

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [OrganizationsController],
      providers: [{ provide: OrganizationsService, useValue: { findAll } }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    await app.init();
  });

  afterAll(async () => app.close());

  beforeEach(() => findAll.mockReset());

  it("GET /v1/organizations returns the public response contract", async () => {
    const organizations = [
      {
        id: "01990000-0000-7000-8000-000000000002",
        code: "ONE",
        name: "ONE Championship",
      },
    ];
    findAll.mockResolvedValue(organizations);

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server).get("/v1/organizations").expect(200);

    expect(response.body).toEqual(organizations);
  });

  it("returns an empty array when no organizations exist", async () => {
    findAll.mockResolvedValue([]);

    const server = app.getHttpServer() as Parameters<typeof request>[0];
    const response = await request(server).get("/v1/organizations").expect(200);

    expect(response.body).toEqual([]);
  });
});
