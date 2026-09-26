import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { FightResponseDto } from "../events/dto/fight-response.dto";
import { recordAdminAuditLog } from "./admin-audit-log";
import type { CreateFightDto } from "./dto/create-fight.dto";
import type { UpdateFightDto } from "./dto/update-fight.dto";

@Injectable()
export class AdminFightsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    eventId: string,
    input: CreateFightDto,
    actorSubject: string,
  ): Promise<FightResponseDto> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const fight = await transaction.fight.create({
          data: {
            eventId,
            cardPosition: input.cardPosition,
            redCornerName: input.redCornerName,
            blueCornerName: input.blueCornerName,
            weightClass: input.weightClass ?? null,
            isTitleFight: input.isTitleFight ?? false,
          },
        });
        await recordAdminAuditLog(transaction, {
          actorSubject,
          action: "CREATE",
          entityType: "FIGHT",
          entityId: fight.id,
        });
        return FightResponseDto.fromModel(fight);
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException(
            "Card position already exists for this event",
          );
        }
        if (error.code === "P2003") {
          throw new NotFoundException("Event not found");
        }
      }
      throw error;
    }
  }

  async update(
    eventId: string,
    fightId: string,
    input: UpdateFightDto,
    actorSubject: string,
  ): Promise<FightResponseDto> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException("At least one fight field is required");
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const fight = await transaction.fight.update({
          where: { id: fightId, eventId },
          data: {
            cardPosition: input.cardPosition,
            redCornerName: input.redCornerName,
            blueCornerName: input.blueCornerName,
            weightClass: input.weightClass,
            isTitleFight: input.isTitleFight,
          },
        });
        await recordAdminAuditLog(transaction, {
          actorSubject,
          action: "UPDATE",
          entityType: "FIGHT",
          entityId: fight.id,
        });
        return FightResponseDto.fromModel(fight);
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2002") {
          throw new ConflictException(
            "Card position already exists for this event",
          );
        }
        if (error.code === "P2025") {
          throw new NotFoundException("Fight not found for this event");
        }
      }
      throw error;
    }
  }
}
