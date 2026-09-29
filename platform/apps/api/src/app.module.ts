import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import { LoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import type { IncomingMessage, ServerResponse } from "node:http";
import { validateEnvironment } from "./config/environment";
import type { EnvironmentVariables } from "./config/environment";
import { PrismaModule } from "./infrastructure/database/prisma.module";
import { EventsModule } from "./modules/events/events.module";
import { IngestionModule } from "./modules/ingestion/ingestion.module";
import { AdminModule } from "./modules/admin/admin.module";
import { HealthModule } from "./modules/health/health.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnvironment,
    }),
    LoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<EnvironmentVariables, true>) => ({
        pinoHttp: {
          level: config.get("LOG_LEVEL", { infer: true }),
          genReqId: (
            _request: IncomingMessage,
            response: ServerResponse,
          ): string => {
            const requestId = randomUUID();
            response.setHeader("x-request-id", requestId);
            return requestId;
          },
          redact: {
            paths: [
              "req.headers.authorization",
              "req.headers.cookie",
              "res.headers.set-cookie",
              "req.body.token",
              "req.body.fcmToken",
            ],
            censor: "[REDACTED]",
          },
          transport:
            config.get("NODE_ENV", { infer: true }) === "development"
              ? { target: "pino-pretty", options: { singleLine: true } }
              : undefined,
        },
      }),
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AdminModule,
    HealthModule,
    OrganizationsModule,
    EventsModule,
    IngestionModule,
  ],
  providers: [{ provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
