import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Transform } from "class-transformer";
import type { TransformFnParams } from "class-transformer";
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from "class-validator";

function trimString({ value }: TransformFnParams): unknown {
  return typeof value === "string" ? value.trim() : value;
}

export class CreateFightDto {
  @ApiProperty({ minimum: 1, example: 1 })
  @IsInt()
  @Min(1)
  cardPosition!: number;

  @ApiProperty({ example: "[DEV] Alex North", maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  redCornerName!: string;

  @ApiProperty({ example: "[DEV] Jordan Vale", maxLength: 120 })
  @Transform(trimString)
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  blueCornerName!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 80 })
  @Transform(trimString)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  weightClass?: string | null;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isTitleFight?: boolean;
}
