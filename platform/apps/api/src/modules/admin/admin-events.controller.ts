import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { EventResponseDto } from "../events/dto/event-response.dto";
import { AdminEventsService } from "./admin-events.service";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { CreateEventDto } from "./dto/create-event.dto";

@ApiTags("admin")
@ApiBearerAuth("oidc")
@UseGuards(AdminAuthGuard)
@Controller("admin/events")
export class AdminEventsController {
  constructor(private readonly adminEventsService: AdminEventsService) {}

  @Post()
  @ApiOperation({ summary: "Create a scheduled combat-sports event" })
  @ApiCreatedResponse({ type: EventResponseDto })
  @ApiBadRequestResponse({ description: "Invalid event data" })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  @ApiNotFoundResponse({ description: "Organization not found" })
  create(@Body() input: CreateEventDto): Promise<EventResponseDto> {
    return this.adminEventsService.create(input);
  }
}
