import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createRemoteJWKSet, jwtVerify } from "jose";
import type { JWTPayload } from "jose";
import type { EnvironmentVariables } from "../../../config/environment";

export interface VerifiedOidcToken {
  subject: string;
  roles: readonly string[];
}

@Injectable()
export class OidcTokenVerifier {
  private readonly issuer: string;
  private readonly audience: string;
  private readonly jwks: ReturnType<typeof createRemoteJWKSet>;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    this.issuer = config.get("OIDC_ISSUER_URL", { infer: true });
    this.audience = config.get("OIDC_AUDIENCE", { infer: true });
    this.jwks = createRemoteJWKSet(
      new URL(config.get("OIDC_JWKS_URL", { infer: true })),
      { timeoutDuration: 5_000 },
    );
  }

  async verify(token: string): Promise<VerifiedOidcToken> {
    const { payload } = await jwtVerify(token, this.jwks, {
      issuer: this.issuer,
      audience: this.audience,
      algorithms: ["RS256"],
      requiredClaims: ["sub", "exp"],
    });

    return {
      subject: this.subjectFrom(payload),
      roles: this.rolesFrom(payload),
    };
  }

  private subjectFrom(payload: JWTPayload): string {
    if (typeof payload.sub !== "string" || payload.sub.length === 0) {
      throw new Error("OIDC token has no subject");
    }
    return payload.sub;
  }

  private rolesFrom(payload: JWTPayload): readonly string[] {
    const roles = payload["roles"];
    if (!Array.isArray(roles) || !roles.every((role) => typeof role === "string")) {
      return [];
    }
    return roles;
  }
}
