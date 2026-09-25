import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from "@nestjs/swagger";
import { EventResponseDto } from "./dto/event-response.dto";
import { EventsService } from "./events.service";

@ApiTags("events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get("upcoming")
  @ApiOperation({ summary: "List upcoming combat-sports events" })
  @ApiOkResponse({ type: EventResponseDto, isArray: true })
  findUpcoming(): Promise<EventResponseDto[]> {
    return this.eventsService.findUpcoming();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get a combat-sports event by ID" })
  @ApiParam({ name: "id", format: "uuid" })
  @ApiOkResponse({ type: EventResponseDto })
  @ApiBadRequestResponse({ description: "Invalid event ID" })
  @ApiNotFoundResponse({ description: "Event not found" })
  findById(
    @Param("id", new ParseUUIDPipe()) id: string,
  ): Promise<EventResponseDto> {
    return this.eventsService.findById(id);
  }
}
