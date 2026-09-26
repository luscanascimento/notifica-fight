import { Module } from "@nestjs/common";
import { AdminAccessController } from "./admin-access.controller";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { OidcTokenVerifier } from "./auth/oidc-token-verifier";

@Module({
  controllers: [AdminAccessController],
  providers: [AdminAuthGuard, OidcTokenVerifier],
})
export class AdminModule {}
