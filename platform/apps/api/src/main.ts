import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import type { NestExpressApplication } from "@nestjs/platform-express";
import helmet from "helmet";
import { Logger } from "nestjs-pino";
import { json, urlencoded } from "express";
import { AppModule } from "./app.module";
import { ApiExceptionFilter } from "./common/filters/api-exception.filter";
import { parseCorsOrigins } from "./config/environment";
import type { EnvironmentVariables } from "./config/environment";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    bodyParser: false,
  });
  app.useLogger(app.get(Logger));

  const config = app.get(ConfigService<EnvironmentVariables, true>);
  const corsOrigins = parseCorsOrigins(config.get("CORS_ORIGINS", { infer: true }));

  app.use(helmet());
  app.use(json({ limit: "100kb" }));
  app.use(urlencoded({ extended: false, limit: "100kb" }));
  app.enableCors({
    origin: corsOrigins.length > 0 ? corsOrigins : false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Request-Id"],
    maxAge: 600,
  });
  app.setGlobalPrefix("v1");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());

  if (config.get("SWAGGER_ENABLED", { infer: true })) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle("Notifica Fight API")
      .setDescription("Versioned API for combat-sports events and administration")
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "OIDC access token for administrative endpoints",
        },
        "oidc",
      )
      .build();
    SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, swaggerConfig));
  }

  app.enableShutdownHooks();
  await app.listen(config.get("PORT", { infer: true }), "0.0.0.0");
}

void bootstrap();
