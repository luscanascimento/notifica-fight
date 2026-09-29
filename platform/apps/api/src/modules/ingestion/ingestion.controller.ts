import { Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from "@nestjs/swagger";
import { AdminAuthGuard } from "../admin/auth/admin-auth.guard";
import { IngestionService } from "./ingestion.service";
import type { SyncResult } from "./ingestion.service";

@ApiTags("admin/ingestion")
@Controller("admin/ingestion")
@UseGuards(AdminAuthGuard)
@ApiBearerAuth("oidc")
export class IngestionController {
  constructor(private readonly ingestionService: IngestionService) {}

  @Post("sync")
  @ApiOperation({
    summary: "Trigger API-Sports MMA data sync",
    description:
      "Fetches upcoming fights from API-Sports and upserts them into the database.",
  })
  @ApiOkResponse({ description: "Sync completed successfully" })
  async sync(): Promise<SyncResult> {
    return this.ingestionService.syncUpcoming();
  }
}
