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
import { FightResponseDto } from "../events/dto/fight-response.dto";
import { AdminFightsService } from "./admin-fights.service";
import { AdminAuthGuard } from "./auth/admin-auth.guard";
import { AdminSubject } from "./auth/admin-subject.decorator";
import { CreateFightDto } from "./dto/create-fight.dto";
import { UpdateFightDto } from "./dto/update-fight.dto";

@ApiTags("admin")
@ApiBearerAuth("oidc")
@UseGuards(AdminAuthGuard)
@Controller("admin/events/:eventId/fights")
export class AdminFightsController {
  constructor(private readonly adminFightsService: AdminFightsService) {}

  @Post()
  @ApiOperation({ summary: "Add a fight to an event card" })
  @ApiParam({ name: "eventId", format: "uuid" })
  @ApiCreatedResponse({ type: FightResponseDto })
  @ApiBadRequestResponse({ description: "Invalid event ID or fight data" })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  @ApiNotFoundResponse({ description: "Event not found" })
  @ApiConflictResponse({ description: "Card position already exists" })
  create(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Body() input: CreateFightDto,
    @AdminSubject() actorSubject: string,
  ): Promise<FightResponseDto> {
    return this.adminFightsService.create(eventId, input, actorSubject);
  }

  @Patch(":fightId")
  @ApiOperation({ summary: "Update a fight on an event card" })
  @ApiParam({ name: "eventId", format: "uuid" })
  @ApiParam({ name: "fightId", format: "uuid" })
  @ApiOkResponse({ type: FightResponseDto })
  @ApiBadRequestResponse({ description: "Invalid event ID, fight ID or data" })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  @ApiNotFoundResponse({ description: "Fight not found for this event" })
  @ApiConflictResponse({ description: "Card position already exists" })
  update(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Param("fightId", new ParseUUIDPipe()) fightId: string,
    @Body() input: UpdateFightDto,
    @AdminSubject() actorSubject: string,
  ): Promise<FightResponseDto> {
    return this.adminFightsService.update(
      eventId,
      fightId,
      input,
      actorSubject,
    );
  }

  @Delete(":fightId")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Remove a fight from an event card" })
  @ApiParam({ name: "eventId", format: "uuid" })
  @ApiParam({ name: "fightId", format: "uuid" })
  @ApiNoContentResponse({ description: "Fight removed" })
  @ApiBadRequestResponse({ description: "Invalid event ID or fight ID" })
  @ApiUnauthorizedResponse({ description: "Bearer token is missing or invalid" })
  @ApiForbiddenResponse({ description: "Token does not grant the admin role" })
  @ApiNotFoundResponse({ description: "Fight not found for this event" })
  remove(
    @Param("eventId", new ParseUUIDPipe()) eventId: string,
    @Param("fightId", new ParseUUIDPipe()) fightId: string,
    @AdminSubject() actorSubject: string,
  ): Promise<void> {
    return this.adminFightsService.remove(eventId, fightId, actorSubject);
  }
}
