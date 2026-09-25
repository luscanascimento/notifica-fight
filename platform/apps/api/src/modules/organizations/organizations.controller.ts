import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { OrganizationResponseDto } from "./dto/organization-response.dto";
import { OrganizationsService } from "./organizations.service";

@ApiTags("organizations")
@Controller("organizations")
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @ApiOkResponse({ type: OrganizationResponseDto, isArray: true })
  findAll(): Promise<OrganizationResponseDto[]> {
    return this.organizationsService.findAll();
  }
}
