import { Module } from "@nestjs/common";
import { AdminAccessController } from "./admin-access.controller";
import { AdminEventsController } from "./admin-events.controller";
import { AdminEventsService } from "./admin-events.service";
import { AdminOrganizationsController } from "./admin-organizations.controller";
import { AdminOrganizationsService } from "./admin-organizations.service";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { OidcTokenVerifier } from "./auth/oidc-token-verifier";

@Module({
  controllers: [
    AdminAccessController,
    AdminEventsController,
    AdminOrganizationsController,
  ],
  providers: [
    AdminAuthGuard,
    OidcTokenVerifier,
    AdminEventsService,
    AdminOrganizationsService,
  ],
})
export class AdminModule {}
