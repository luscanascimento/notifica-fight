import { ApiProperty } from "@nestjs/swagger";
import type { Organization } from "../../../generated/prisma/client";

export class OrganizationResponseDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "ONE" })
  code!: string;

  @ApiProperty({ example: "ONE Championship" })
  name!: string;

  static fromModel(organization: Organization): OrganizationResponseDto {
    return {
      id: organization.id,
      code: organization.code,
      name: organization.name,
    };
  }
}
