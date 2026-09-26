export type NodeEnvironment = "development" | "test" | "production";

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DATABASE_URL: string;
  CORS_ORIGINS: string;
  LOG_LEVEL: string;
  SWAGGER_ENABLED: boolean;
  OIDC_ISSUER_URL: string;
  OIDC_AUDIENCE: string;
  OIDC_JWKS_URL: string;
  OIDC_ADMIN_ROLE: string;
}

function requiredString(
  values: Record<string, unknown>,
  key: string,
): string {
  const value = values[key];
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${key} must be a non-empty string`);
  }
  return value;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  if (value === undefined) return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error("Boolean environment values must be 'true' or 'false'");
}

function requiredHttpsUrl(
  values: Record<string, unknown>,
  key: string,
  nodeEnv: NodeEnvironment,
): string {
  const value = requiredString(values, key);
  let url: URL;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${key} must be a valid URL`);
  }

  const isLoopback = ["localhost", "127.0.0.1", "::1"].includes(url.hostname);
  const allowsLocalHttp = nodeEnv !== "production" && isLoopback;
  if (url.protocol !== "https:" && !(url.protocol === "http:" && allowsLocalHttp)) {
    throw new Error(`${key} must use HTTPS`);
  }
  if (url.username || url.password) {
    throw new Error(`${key} must not contain credentials`);
  }

  return value;
}

export function validateEnvironment(
  values: Record<string, unknown>,
): EnvironmentVariables {
  const nodeEnv = (values["NODE_ENV"] ?? "development") as string;
  if (!["development", "test", "production"].includes(nodeEnv)) {
    throw new Error("NODE_ENV must be development, test, or production");
  }

  const port = Number(values["PORT"] ?? 3000);
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error("PORT must be an integer between 1 and 65535");
  }

  const databaseUrl = requiredString(values, "DATABASE_URL");
  if (!databaseUrl.startsWith("postgresql://") && !databaseUrl.startsWith("postgres://")) {
    throw new Error("DATABASE_URL must be a PostgreSQL connection URL");
  }

  const validatedNodeEnv = nodeEnv as NodeEnvironment;

  return {
    NODE_ENV: validatedNodeEnv,
    PORT: port,
    DATABASE_URL: databaseUrl,
    CORS_ORIGINS:
      typeof values["CORS_ORIGINS"] === "string" ? values["CORS_ORIGINS"] : "",
    LOG_LEVEL:
      typeof values["LOG_LEVEL"] === "string" ? values["LOG_LEVEL"] : "info",
    SWAGGER_ENABLED: parseBoolean(
      values["SWAGGER_ENABLED"],
      nodeEnv !== "production",
    ),
    OIDC_ISSUER_URL: requiredHttpsUrl(
      values,
      "OIDC_ISSUER_URL",
      validatedNodeEnv,
    ),
    OIDC_AUDIENCE: requiredString(values, "OIDC_AUDIENCE"),
    OIDC_JWKS_URL: requiredHttpsUrl(
      values,
      "OIDC_JWKS_URL",
      validatedNodeEnv,
    ),
    OIDC_ADMIN_ROLE: requiredString(values, "OIDC_ADMIN_ROLE"),
  };
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
