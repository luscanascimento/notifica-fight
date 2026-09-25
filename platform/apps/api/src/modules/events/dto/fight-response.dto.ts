import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import type { Fight } from "../../../generated/prisma/client";

export class FightResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  eventId!: string;

  @ApiProperty({ minimum: 1, example: 1 })
  cardPosition!: number;

  @ApiProperty({ example: "[DEV] Alex North" })
  redCornerName!: string;

  @ApiProperty({ example: "[DEV] Jordan Vale" })
  blueCornerName!: string;

  @ApiPropertyOptional({ nullable: true, example: "Lightweight" })
  weightClass!: string | null;

  @ApiProperty({ example: false })
  isTitleFight!: boolean;

  static fromModel(fight: Fight): FightResponseDto {
    return {
      id: fight.id,
      eventId: fight.eventId,
      cardPosition: fight.cardPosition,
      redCornerName: fight.redCornerName,
      blueCornerName: fight.blueCornerName,
      weightClass: fight.weightClass,
      isTitleFight: fight.isTitleFight,
    };
  }
}
