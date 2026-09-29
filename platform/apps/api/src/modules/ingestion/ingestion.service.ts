import { Injectable, Logger } from "@nestjs/common";
import { EventStatus } from "../../generated/prisma/enums";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { ApiSportsClient } from "./api-sports.client";
import type { ApiSportsFight } from "./api-sports.client";

function normalizeOrg(slug: string | null): { code: string; name: string } {
  if (!slug) {
    return { code: "UFC", name: "UFC" };
  }
  const upper = slug.toUpperCase();
  if (upper.startsWith("UFC")) {
    return { code: "UFC", name: "UFC" };
  }
  if (upper.startsWith("ONE")) {
    return { code: "ONE", name: "ONE Championship" };
  }
  if (upper.startsWith("RWS")) {
    return { code: "RWS", name: "RWS" };
  }
  if (upper.startsWith("PFL")) {
    return { code: "PFL", name: "PFL" };
  }
  if (upper.startsWith("BELLATOR")) {
    return { code: "BELL", name: "Bellator" };
  }
  const firstWord = slug.split(" ")[0]?.replace(/[^a-zA-Z0-9]/g, "") ?? "MMA";
  return {
    code: firstWord.substring(0, 32).toUpperCase(),
    name: firstWord,
  };
}

function mapFightStatus(statusShort: string): EventStatus {
  switch (statusShort) {
    case "NS":
    case "TBD":
      return EventStatus.SCHEDULED;
    case "FT":
      return EventStatus.FINISHED;
    case "CANC":
      return EventStatus.CANCELED;
    case "PST":
      return EventStatus.POSTPONED;
    default:
      return EventStatus.SCHEDULED;
  }
}

export interface SyncResult {
  organizationsUpserted: number;
  eventsUpserted: number;
  fightsUpserted: number;
  errors: string[];
}

interface EventGroup {
  slug: string;
  dateStr: string;
  fights: ApiSportsFight[];
}

@Injectable()
export class IngestionService {
  private readonly logger = new Logger(IngestionService.name);

  constructor(
    private readonly apiSports: ApiSportsClient,
    private readonly prisma: PrismaService,
  ) {}

  async syncUpcoming(daysAhead: number = 60): Promise<SyncResult> {
    if (!this.apiSports.isConfigured) {
      throw new Error(
        "API_SPORTS_KEY is not configured. Set it in the environment to enable ingestion.",
      );
    }

    const result: SyncResult = {
      organizationsUpserted: 0,
      eventsUpserted: 0,
      fightsUpserted: 0,
      errors: [],
    };

    const allFights: ApiSportsFight[] = [];
    const today = new Date();

    for (let dayOffset = 0; dayOffset <= daysAhead; dayOffset++) {
      const date = new Date(today);
      date.setUTCDate(date.getUTCDate() + dayOffset);
      const dateStr = date.toISOString().split("T")[0] ?? "";

      try {
        const fights = await this.apiSports.getFightsByDate(dateStr);
        if (fights.length > 0) {
          this.logger.log(`Found ${fights.length} fights for ${dateStr}`);
          allFights.push(...fights);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn(`Failed to fetch fights for ${dateStr}: ${message}`);
        result.errors.push(`${dateStr}: ${message}`);
      }
    }

    if (allFights.length === 0) {
      this.logger.log("No upcoming fights found by date range.");
      return result;
    }

    const groups = this.groupFightsIntoEvents(allFights);
    for (const group of groups) {
      await this.upsertEventGroup(group, result);
    }

    return result;
  }

  async syncSeason(
    season: number = 2024,
    options: { projectToUpcoming?: boolean; limitEvents?: number } = {},
  ): Promise<SyncResult> {
    if (!this.apiSports.isConfigured) {
      throw new Error(
        "API_SPORTS_KEY is not configured. Set it in the environment to enable ingestion.",
      );
    }

    const result: SyncResult = {
      organizationsUpserted: 0,
      eventsUpserted: 0,
      fightsUpserted: 0,
      errors: [],
    };

    this.logger.log(`Fetching fights for season ${season}...`);
    const fights = await this.apiSports.getFightsBySeason(season);
    this.logger.log(`Retrieved ${fights.length} fights from season ${season}`);

    let groups = this.groupFightsIntoEvents(fights);

    // Sort events by date descending so the newest events are first
    groups.sort((a, b) => b.dateStr.localeCompare(a.dateStr));

    if (options.limitEvents && options.limitEvents > 0) {
      groups = groups.slice(0, options.limitEvents);
    }

    const now = new Date();

    for (const [index, group] of groups.entries()) {
      try {
        let overrideStartTime: Date | undefined;
        let overrideStatus: EventStatus | undefined;

        if (options.projectToUpcoming) {
          // Project events into the upcoming future: 7 days, 14 days, 21 days... from now
          const daysFromNow = 7 * (index + 1);
          overrideStartTime = new Date(
            now.getTime() + daysFromNow * 24 * 60 * 60 * 1_000,
          );
          // Set to 22:00 UTC (typical fight night main card time)
          overrideStartTime.setUTCHours(22, 0, 0, 0);
          overrideStatus = EventStatus.SCHEDULED;
        }

        await this.upsertEventGroup(
          group,
          result,
          overrideStartTime,
          overrideStatus,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(`Failed to upsert event ${group.slug}: ${message}`);
        result.errors.push(`${group.slug}: ${message}`);
      }
    }

    this.logger.log(
      `Season sync completed: ${result.organizationsUpserted} orgs, ${result.eventsUpserted} events, ${result.fightsUpserted} fights`,
    );

    return result;
  }

  private groupFightsIntoEvents(fights: ApiSportsFight[]): EventGroup[] {
    const groups = new Map<string, EventGroup>();

    for (const fight of fights) {
      const dateStr = fight.date.split("T")[0] ?? "unknown-date";
      const slug = fight.slug ?? `Event on ${dateStr}`;
      const groupKey = `${slug}__${dateStr}`;

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          slug,
          dateStr,
          fights: [],
        });
      }

      groups.get(groupKey)!.fights.push(fight);
    }

    return Array.from(groups.values());
  }

  private async upsertEventGroup(
    group: EventGroup,
    result: SyncResult,
    overrideStartTime?: Date,
    overrideStatus?: EventStatus,
  ): Promise<void> {
    const org = normalizeOrg(group.slug);

    const organization = await this.prisma.organization.upsert({
      where: { code: org.code },
      update: { name: org.name },
      create: { code: org.code, name: org.name },
    });
    result.organizationsUpserted++;

    // Calculate event start time
    let startTime: Date;
    if (overrideStartTime) {
      startTime = overrideStartTime;
    } else {
      const timestamps = group.fights
        .map((f) => f.timestamp)
        .filter((t): t is number => typeof t === "number" && t > 0);

      if (timestamps.length > 0) {
        startTime = new Date(Math.min(...timestamps) * 1000);
      } else {
        startTime = new Date(`${group.dateStr}T22:00:00.000Z`);
      }
    }

    const eventStatus = overrideStatus ?? this.deriveEventStatus(group.fights);
    const slugSanitized = group.slug.replace(/[^a-zA-Z0-9_-]/g, "_").toLowerCase();
    const eventExternalId = `apisports_event_${slugSanitized}`;

    // Upsert Event
    const existingEvent = await this.prisma.event.findFirst({
      where: { externalId: eventExternalId },
    });

    const event = existingEvent
      ? await this.prisma.event.update({
          where: { id: existingEvent.id },
          data: {
            name: group.slug,
            organizationId: organization.id,
            startTime,
            timezone: "UTC",
            status: eventStatus,
          },
        })
      : await this.prisma.event.create({
          data: {
            organizationId: organization.id,
            externalId: eventExternalId,
            name: group.slug,
            startTime,
            timezone: "UTC",
            status: eventStatus,
          },
        });

    result.eventsUpserted++;

    // Sort fights inside this event: main event first, then rest
    const sortedFights = [...group.fights].sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return a.id - b.id;
    });

    for (const [index, fight] of sortedFights.entries()) {
      const cardPosition = index + 1;
      const fightExternalId = `apisports_fight_${fight.id}`;
      const redCorner = fight.fighters.first?.name?.trim() || "Fighter A";
      const blueCorner = fight.fighters.second?.name?.trim() || "Fighter B";
      const isTitleFight =
        fight.is_main &&
        (group.slug.toLowerCase().includes("championship") ||
          group.slug.match(/UFC\s+\d+/i) !== null);

      const existingFight = await this.prisma.fight.findFirst({
        where: { externalId: fightExternalId },
      });

      if (existingFight) {
        await this.prisma.fight.update({
          where: { id: existingFight.id },
          data: {
            eventId: event.id,
            cardPosition,
            redCornerName: redCorner,
            blueCornerName: blueCorner,
            weightClass: fight.category,
            isTitleFight,
          },
        });
      } else {
        // Handle possible unique constraint on [eventId, cardPosition]
        await this.prisma.fight.upsert({
          where: {
            eventId_cardPosition: {
              eventId: event.id,
              cardPosition,
            },
          },
          update: {
            externalId: fightExternalId,
            redCornerName: redCorner,
            blueCornerName: blueCorner,
            weightClass: fight.category,
            isTitleFight,
          },
          create: {
            eventId: event.id,
            externalId: fightExternalId,
            cardPosition,
            redCornerName: redCorner,
            blueCornerName: blueCorner,
            weightClass: fight.category,
            isTitleFight,
          },
        });
      }

      result.fightsUpserted++;
    }
  }

  private deriveEventStatus(fights: ApiSportsFight[]): EventStatus {
    const statuses = fights.map((f) => mapFightStatus(f.status.short));
    if (statuses.length === 0) return EventStatus.SCHEDULED;
    if (statuses.every((s) => s === EventStatus.FINISHED)) return EventStatus.FINISHED;
    if (statuses.every((s) => s === EventStatus.CANCELED)) return EventStatus.CANCELED;
    if (statuses.some((s) => s === EventStatus.POSTPONED)) return EventStatus.POSTPONED;
    return EventStatus.SCHEDULED;
  }
}
