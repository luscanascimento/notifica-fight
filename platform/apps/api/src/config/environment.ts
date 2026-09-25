export type NodeEnvironment = "development" | "test" | "production";

export interface EnvironmentVariables {
  NODE_ENV: NodeEnvironment;
  PORT: number;
  DATABASE_URL: string;
  CORS_ORIGINS: string;
  LOG_LEVEL: string;
  SWAGGER_ENABLED: boolean;
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

  return {
    NODE_ENV: nodeEnv as NodeEnvironment,
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
  };
}

export function parseCorsOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}
