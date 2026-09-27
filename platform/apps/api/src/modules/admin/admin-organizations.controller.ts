import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { OrganizationResponseDto } from "../organizations/dto/organization-response.dto";
import { AdminOrganizationsService } from "./admin-organizations.service";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { AdminSubject } from "./auth/admin-subject.decorator";
import { CreateOrganizationDto } from "./dto/create-organization.dto";
import { UpdateOrganizationDto } from "./dto/update-organization.dto";

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
    @AdminSubject() actorSubject: string,
  ): Promise<OrganizationResponseDto> {
    return this.adminOrganizationsService.create(input, actorSubject);
  }

  @Patch(":organizationId")
  @ApiOperation({ summary: "Update a combat-sports organization" })
  @ApiParam({ name: "organizationId", format: "uuid" })
  @ApiOkResponse({ type: OrganizationResponseDto })
  @ApiBadRequestResponse({
    description: "Invalid organization ID or organization data",
  })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  @ApiNotFoundResponse({ description: "Organization not found" })
  @ApiConflictResponse({ description: "Organization code already exists" })
  update(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @Body() input: UpdateOrganizationDto,
    @AdminSubject() actorSubject: string,
  ): Promise<OrganizationResponseDto> {
    return this.adminOrganizationsService.update(
      organizationId,
      input,
      actorSubject,
    );
  }

  @Delete(":organizationId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a combat-sports organization" })
  @ApiParam({ name: "organizationId", format: "uuid" })
  @ApiNoContentResponse({ description: "Organization removed" })
  @ApiBadRequestResponse({ description: "Invalid organization ID" })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  @ApiNotFoundResponse({ description: "Organization not found" })
  @ApiConflictResponse({
    description: "Organization has events and cannot be removed",
  })
  remove(
    @Param("organizationId", new ParseUUIDPipe()) organizationId: string,
    @AdminSubject() actorSubject: string,
  ): Promise<void> {
    return this.adminOrganizationsService.remove(
      organizationId,
      actorSubject,
    );
  }
}
