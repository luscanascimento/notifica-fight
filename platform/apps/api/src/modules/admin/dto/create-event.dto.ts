import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import type { TransformFnParams } from "class-transformer";
import {
  IsISO31661Alpha2,
  IsISO8601,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsTimeZone,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

function uppercaseString(params: TransformFnParams): unknown {
  const value = trimString(params);
  return typeof value === "string" ? value.toUpperCase() : value;
}

export class CreateEventDto {
  @ApiProperty({ format: "uuid" })
  @IsUUID()
  organizationId!: string;

  @ApiProperty({ example: "[DEV] Example Event", maxLength: 200 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  @ApiProperty({
    example: "2030-01-12T23:00:00.000Z",
    format: "date-time",
  })
  @IsString()
  @IsISO8601({ strict: true, strictSeparator: true })
  @Matches(/(?:Z|[+-]\d{2}:\d{2})$/)
  startTime!: string;

  @ApiProperty({ example: "America/New_York", maxLength: 64 })
  @Transform(trimString)
  @IsString()
  @MaxLength(64)
  @IsTimeZone()
  timezone!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 160 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  venueName?: string | null;

  @ApiPropertyOptional({ nullable: true, maxLength: 100 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city?: string | null;

  @ApiPropertyOptional({ nullable: true, minLength: 2, maxLength: 2 })
  @Transform(uppercaseString)
  @IsOptional()
  @IsString()
  @IsISO31661Alpha2()
  countryCode?: string | null;
}
