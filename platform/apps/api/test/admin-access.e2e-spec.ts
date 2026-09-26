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
      controllers: [AdminAccessController],
      providers: [
        AdminAuthGuard,
        OidcTokenVerifier,
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

  it("rejects a request without a bearer token", async () => {
    const server = app.getHttpServer() as Parameters<typeof request>[0];

    await request(server).get("/v1/admin/access").expect(401);
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
