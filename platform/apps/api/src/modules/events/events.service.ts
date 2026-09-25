import { Injectable, NotFoundException } from "@nestjs/common";
import { EventStatus } from "../../generated/prisma/enums";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { EventResponseDto } from "./dto/event-response.dto";

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<EventResponseDto> {
    const event = await this.prisma.event.findUnique({
      where: { id },
      include: { organization: true },
    });

    if (!event) {
      throw new NotFoundException("Event not found");
    }

    return EventResponseDto.fromModel(event);
  }

  async findUpcoming(now: Date = new Date()): Promise<EventResponseDto[]> {
    const events = await this.prisma.event.findMany({
      where: {
        startTime: { gte: now },
        status: { in: [EventStatus.SCHEDULED, EventStatus.POSTPONED] },
      },
      include: { organization: true },
      orderBy: { startTime: "asc" },
      take: 50,
    });

    return events.map((event) => EventResponseDto.fromModel(event));
  }
}
