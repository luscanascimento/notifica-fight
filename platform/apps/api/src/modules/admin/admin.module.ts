import { Module } from "@nestjs/common";
import { AdminAccessController } from "./admin-access.controller";
import { AdminOrganizationsController } from "./admin-organizations.controller";
import { AdminOrganizationsService } from "./admin-organizations.service";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { OidcTokenVerifier } from "./auth/oidc-token-verifier";

@Module({
  controllers: [AdminAccessController, AdminOrganizationsController],
  providers: [AdminAuthGuard, OidcTokenVerifier, AdminOrganizationsService],
})
export class AdminModule {}
