import { Module } from "@nestjs/common";
import { AppVersionController } from "./app-version.controller";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController, AppVersionController],
})
export class HealthModule {}
