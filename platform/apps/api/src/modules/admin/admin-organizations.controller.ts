import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { OrganizationResponseDto } from "../organizations/dto/organization-response.dto";
import { AdminOrganizationsService } from "./admin-organizations.service";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { CreateOrganizationDto } from "./dto/create-organization.dto";

@ApiTags("admin")
@ApiBearerAuth("oidc")
@UseGuards(AdminAuthGuard)
@Controller("admin/organizations")
export class AdminOrganizationsController {
  constructor(
    private readonly adminOrganizationsService: AdminOrganizationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a combat-sports organization" })
  @ApiCreatedResponse({ type: OrganizationResponseDto })
  @ApiBadRequestResponse({ description: "Invalid organization data" })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  @ApiConflictResponse({ description: "Organization code already exists" })
  create(
    @Body() input: CreateOrganizationDto,
  ): Promise<OrganizationResponseDto> {
    return this.adminOrganizationsService.create(input);
  }
}
