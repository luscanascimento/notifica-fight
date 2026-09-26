import {
  Body,
  Controller,
  Param,
  ParseUUIDPipe,
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
}
