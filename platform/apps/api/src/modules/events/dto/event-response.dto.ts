import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { EventStatus } from "../../../generated/prisma/enums";
import type { Event, Organization } from "../../../generated/prisma/client";

export class EventOrganizationResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "UFC" })
  code!: string;

  @ApiProperty({ example: "UFC" })
  name!: string;
}

export class EventResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "[DEV] Example Event" })
  name!: string;

  @ApiProperty({ format: "date-time" })
  startTime!: string;

  @ApiProperty({ example: "America/New_York" })
  timezone!: string;

  @ApiProperty({ enum: EventStatus })
  status!: EventStatus;

  @ApiPropertyOptional({ nullable: true })
  venueName!: string | null;

  @ApiPropertyOptional({ nullable: true })
  city!: string | null;

  @ApiPropertyOptional({ nullable: true, minLength: 2, maxLength: 2 })
  countryCode!: string | null;

  @ApiProperty({ type: EventOrganizationResponseDto })
  organization!: EventOrganizationResponseDto;

  static fromModel(
    event: Event & { organization: Organization },
  ): EventResponseDto {
    return {
      id: event.id,
      name: event.name,
      startTime: event.startTime.toISOString(),
      timezone: event.timezone,
      status: event.status,
      venueName: event.venueName,
      city: event.city,
      countryCode: event.countryCode,
      organization: {
        id: event.organization.id,
        code: event.organization.code,
        name: event.organization.name,
      },
    };
  }
}
