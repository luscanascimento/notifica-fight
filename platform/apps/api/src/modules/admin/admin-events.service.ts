import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { EventStatus } from "../../generated/prisma/enums";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { EventResponseDto } from "../events/dto/event-response.dto";
import type { CreateEventDto } from "./dto/create-event.dto";

@Injectable()
export class AdminEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateEventDto): Promise<EventResponseDto> {
    try {
      const event = await this.prisma.event.create({
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
      return EventResponseDto.fromModel(event);
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
}
