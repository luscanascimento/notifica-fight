import { validateEnvironment } from "./environment";

const validEnvironment = {
  NODE_ENV: "production",
  PORT: "3000",
  DATABASE_URL: "postgresql://user:password@database:5432/notifica",
  OIDC_ISSUER_URL: "https://identity.example.com/",
  OIDC_AUDIENCE: "notifica-fight-api",
  OIDC_JWKS_URL: "https://identity.example.com/.well-known/jwks.json",
  OIDC_ADMIN_ROLE: "notifica-admin",
  API_SPORTS_KEY: "test-key-for-ci",
};

describe("environment validation", () => {
  it("accepts complete production OIDC configuration", () => {
    const environment = validateEnvironment(validEnvironment);

    expect(environment.OIDC_AUDIENCE).toBe("notifica-fight-api");
    expect(environment.OIDC_ADMIN_ROLE).toBe("notifica-admin");
  });

  it("fails when an OIDC setting is missing", () => {
    const missingAudience: Record<string, unknown> = { ...validEnvironment };
    delete missingAudience["OIDC_AUDIENCE"];

    expect(() => validateEnvironment(missingAudience)).toThrow(
      "OIDC_AUDIENCE must be a non-empty string",
    );
  });

  it("rejects insecure OIDC URLs in production", () => {
    expect(() =>
      validateEnvironment({
        ...validEnvironment,
        OIDC_JWKS_URL: "http://identity.example.com/jwks",
      }),
    ).toThrow("OIDC_JWKS_URL must use HTTPS");
  });

  it("allows loopback HTTP for local development", () => {
    const environment = validateEnvironment({
      ...validEnvironment,
      NODE_ENV: "development",
      OIDC_ISSUER_URL: "http://localhost:8080/realms/notifica",
      OIDC_JWKS_URL: "http://127.0.0.1:8080/realms/notifica/certs",
    });

    expect(environment.OIDC_ISSUER_URL).toContain("localhost");
  });
});
