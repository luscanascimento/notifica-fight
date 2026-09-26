import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { EnvironmentVariables } from "../../../config/environment";
import type { AdminRequest } from "./admin-principal";
import { OidcTokenVerifier } from "./oidc-token-verifier";

@Injectable()
export class AdminAuthGuard implements CanActivate {
  private readonly adminRole: string;

  constructor(
    private readonly tokenVerifier: OidcTokenVerifier,
    config: ConfigService<EnvironmentVariables, true>,
  ) {
    this.adminRole = config.get("OIDC_ADMIN_ROLE", { infer: true });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AdminRequest>();
    const token = this.bearerTokenFrom(request);
    if (!token) {
      throw new UnauthorizedException("Bearer token is required");
    }

    let principal: Awaited<ReturnType<OidcTokenVerifier["verify"]>>;
    try {
      principal = await this.tokenVerifier.verify(token);
    } catch {
      throw new UnauthorizedException("Bearer token is invalid");
    }

    if (!principal.roles.includes(this.adminRole)) {
      throw new ForbiddenException("Admin role is required");
    }

    request.adminPrincipal = { subject: principal.subject };
    return true;
  }

  private bearerTokenFrom(request: Request): string | undefined {
    const authorization = request.headers.authorization;
    if (!authorization) return undefined;

    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    return match?.[1];
  }
}
