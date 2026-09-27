import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { EventStatus } from "../../generated/prisma/enums";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { EventResponseDto } from "../events/dto/event-response.dto";
import { recordAdminAuditLog } from "./admin-audit-log";
import type { CreateEventDto } from "./dto/create-event.dto";
import type { UpdateEventDto } from "./dto/update-event.dto";

@Injectable()
export class AdminEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: CreateEventDto,
    actorSubject: string,
  ): Promise<EventResponseDto> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const event = await transaction.event.create({
          data: {
            organizationId: input.organizationId,
            name: input.name,
            startTime: new Date(input.startTime),
            timezone: input.timezone,
            status: EventStatus.SCHEDULED,
            venueName: input.venueName ?? null,
            city: input.city ?? null,
            countryCode: input.countryCode ?? null,
          },
          include: { organization: true },
        });
        await recordAdminAuditLog(transaction, {
          actorSubject,
          action: "CREATE",
          entityType: "EVENT",
          entityId: event.id,
        });
        return EventResponseDto.fromModel(event);
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        throw new NotFoundException("Organization not found");
      }
      throw error;
    }
  }

  async update(
    eventId: string,
    input: UpdateEventDto,
    actorSubject: string,
  ): Promise<EventResponseDto> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException("At least one event field is required");
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const event = await transaction.event.update({
          where: { id: eventId },
          data: {
            organizationId: input.organizationId,
            name: input.name,
            startTime: input.startTime ? new Date(input.startTime) : undefined,
            timezone: input.timezone,
            status: input.status,
            venueName: input.venueName,
            city: input.city,
            countryCode: input.countryCode,
          },
          include: { organization: true },
        });
        await recordAdminAuditLog(transaction, {
          actorSubject,
          action: "UPDATE",
          entityType: "EVENT",
          entityId: event.id,
        });
        return EventResponseDto.fromModel(event);
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Event not found");
        }
        if (error.code === "P2003") {
          throw new NotFoundException("Organization not found");
        }
      }
      throw error;
    }
  }

  async remove(eventId: string, actorSubject: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (transaction) => {
        const event = await transaction.event.delete({
          where: { id: eventId },
        });
        await recordAdminAuditLog(transaction, {
          actorSubject,
          action: "DELETE",
          entityType: "EVENT",
          entityId: event.id,
        });
      });
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        throw new NotFoundException("Event not found");
      }
      throw error;
    }
  }
}
