import { ConflictException, Injectable } from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { OrganizationResponseDto } from "../organizations/dto/organization-response.dto";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";

@Injectable()
export class AdminOrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(input: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    try {
      const organization = await this.prisma.organization.create({
        data: { code: input.code, name: input.name },
      });
      return OrganizationResponseDto.fromModel(organization);
    } catch (error: unknown) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        throw new ConflictException("Organization code already exists");
      }
      throw error;
    }
  }
}
