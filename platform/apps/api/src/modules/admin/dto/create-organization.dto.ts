import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, Matches, MaxLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class CreateOrganizationDto {
  @ApiProperty({
    example: "PFL",
    maxLength: 32,
    pattern: "^[A-Z0-9]+(?:-[A-Z0-9]+)*$",
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  @Matches(/^[A-Z0-9]+(?:-[A-Z0-9]+)*$/)
  code!: string;

  @ApiProperty({ example: "Professional Fighters League", maxLength: 120 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;
}
