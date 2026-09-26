import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
  ApiUnauthorizedResponse,
} from "@nestjs/swagger";
import { EventResponseDto } from "../events/dto/event-response.dto";
import { AdminEventsService } from "./admin-events.service";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { AdminSubject } from "./auth/admin-subject.decorator";
import { CreateEventDto } from "./dto/create-event.dto";
import { UpdateEventDto } from "./dto/update-event.dto";

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
  create(
    @Body() input: CreateEventDto,
    @AdminSubject() actorSubject: string,
  ): Promise<EventResponseDto> {
    return this.adminEventsService.create(input, actorSubject);
  }

  @Patch(":eventId")
  @ApiOperation({ summary: "Update a combat-sports event" })
  @ApiParam({ name: "eventId", format: "uuid" })
  @ApiOkResponse({ type: EventResponseDto })
  @ApiBadRequestResponse({ description: "Invalid event ID or event data" })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  @ApiNotFoundResponse({ description: "Event or organization not found" })
  update(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Body() input: UpdateEventDto,
    @AdminSubject() actorSubject: string,
  ): Promise<EventResponseDto> {
    return this.adminEventsService.update(eventId, input, actorSubject);
  }
}
