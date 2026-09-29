import { Module } from "@nestjs/common";
import { AdminModule } from "../admin/admin.module";
import { ApiSportsClient } from "./api-sports.client";
import { IngestionController } from "./ingestion.controller";
import { IngestionService } from "./ingestion.service";

@Module({
  imports: [AdminModule],
  controllers: [IngestionController],
  providers: [ApiSportsClient, IngestionService],
  exports: [IngestionService],
})
export class IngestionModule {}
