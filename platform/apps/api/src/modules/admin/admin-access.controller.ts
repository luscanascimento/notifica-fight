import { Controller, Get, UseGuards } from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiForbiddenResponse,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { AdminAuthGuard } from "./auth/admin-auth.guard";

class AdminAccessResponseDto {
  @ApiProperty({ example: true })
  authorized!: boolean;
}

@ApiTags("admin")
@ApiBearerAuth("oidc")
@UseGuards(AdminAuthGuard)
@Controller("admin/access")
export class AdminAccessController {
  @Get()
  @ApiOperation({ summary: "Verify administrative API access" })
  @ApiOkResponse({ type: AdminAccessResponseDto })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  check(): AdminAccessResponseDto {
    return { authorized: true };
  }
}
