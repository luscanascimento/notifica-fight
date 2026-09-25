import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
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
}
