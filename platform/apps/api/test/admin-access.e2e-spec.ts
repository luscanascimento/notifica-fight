import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import {
  exportJWK,
  generateKeyPair,
  SignJWT,
} from "jose";
import type { KeyLike } from "jose";
import { createServer } from "node:http";
import type { Server } from "node:http";
import request from "supertest";
import { AdminAccessController } from "../src/modules/admin/admin-access.controller";
import { AdminEventsController } from "../src/modules/admin/admin-events.controller";
import { AdminEventsService } from "../src/modules/admin/admin-events.service";
import { AdminOrganizationsController } from "../src/modules/admin/admin-organizations.controller";
import { AdminOrganizationsService } from "../src/modules/admin/admin-organizations.service";
import { AdminAuthGuard } from "../src/modules/admin/auth/admin-auth.guard";
import { OidcTokenVerifier } from "../src/modules/admin/auth/oidc-token-verifier";

describe("Administrative access endpoint", () => {
  const issuer = "https://identity.example.test/";
  const audience = "notifica-fight-api";
  const adminRole = "notifica-admin";
  const keyId = "test-key";
  let app: INestApplication;
  let jwksServer: Server;
  let privateKey: KeyLike;
  const createEvent = jest.fn();
  const createOrganization = jest.fn();

  beforeAll(async () => {
    const keyPair = await generateKeyPair("RS256");
    privateKey = keyPair.privateKey;
    const publicJwk = await exportJWK(keyPair.publicKey);
    const jwks = JSON.stringify({
      keys: [{ ...publicJwk, alg: "RS256", kid: keyId, use: "sig" }],
    });

    jwksServer = createServer((_request, response) => {
      response.setHeader("content-type", "application/json");
      response.end(jwks);
    });
    await new Promise<void>((resolve) => {
      jwksServer.listen(0, "127.0.0.1", resolve);
    });
    const address = jwksServer.address();
    if (!address || typeof address === "string") {
      throw new Error("Test JWKS server did not bind to a TCP port");
    }

    const configuration: Record<string, string> = {
      OIDC_ISSUER_URL: issuer,
      OIDC_AUDIENCE: audience,
      OIDC_JWKS_URL: `http://127.0.0.1:${address.port}/jwks`,
      OIDC_ADMIN_ROLE: adminRole,
    };
    const moduleRef = await Test.createTestingModule({
      controllers: [
        AdminAccessController,
        AdminEventsController,
        AdminOrganizationsController,
      ],
      providers: [
        AdminAuthGuard,
        OidcTokenVerifier,
        {
          provide: AdminEventsService,
          useValue: { create: createEvent },
        },
        {
          provide: AdminOrganizationsService,
          useValue: { create: createOrganization },
        },
        {
          provide: ConfigService,
          useValue: { get: (key: string): string => configuration[key] ?? "" },
        },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix("v1");
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await new Promise<void>((resolve, reject) => {
      jwksServer.close((error) => (error ? reject(error) : resolve()));
    });
  });

  beforeEach(() => jest.clearAllMocks());

  it("rejects a request without a bearer token", async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).get("/v1/admin/access").expect(401);
  });

  it.each([
    ["/v1/admin/events", createEvent],
    ["/v1/admin/organizations", createOrganization],
  ])("protects %s with the same bearer guard", async (path, create) => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .post(path)
      .send({})
      .expect(401);

    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a token with the wrong audience", async () => {
    const token = await signToken([adminRole], "another-api");
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get("/v1/admin/access")
      .set("authorization", `Bearer ${token}`)
      .expect(401);
  });

  it("forbids a valid token without the configured admin role", async () => {
    const token = await signToken(["content-reader"]);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server)
      .get("/v1/admin/access")
      .set("authorization", `Bearer ${token}`)
      .expect(403);
  });

  it("accepts a verified token with the configured admin role", async () => {
    const token = await signToken([adminRole]);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .get("/v1/admin/access")
      .set("authorization", `Bearer ${token}`)
      .expect(200);

    expect(response.body).toEqual({ authorized: true });
  });

  it("propagates the verified subject to an administrative mutation", async () => {
    const organization = {
      id: "01990000-0000-7000-8000-000000000004",
      code: "PFL",
      name: "Professional Fighters League",
    };
    createOrganization.mockResolvedValue(organization);
    const token = await signToken([adminRole]);
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    const response = await request(server)
      .post("/v1/admin/organizations")
      .set("authorization", `Bearer ${token}`)
      .send({ code: organization.code, name: organization.name })
      .expect(201);

    expect(response.body).toEqual(organization);
    expect(createOrganization).toHaveBeenCalledWith(
      { code: organization.code, name: organization.name },
      "admin-test-subject",
    );
  });

  async function signToken(
    roles: readonly string[],
    tokenAudience = audience,
  ): Promise<string> {
    return new SignJWT({ roles })
      .setProtectedHeader({ alg: "RS256", kid: keyId })
      .setIssuer(issuer)
      .setAudience(tokenAudience)
      .setSubject("admin-test-subject")
      .setIssuedAt()
      .setExpirationTime("5m")
      .sign(privateKey);
  }
});
