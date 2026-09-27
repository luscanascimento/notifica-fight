import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "../../generated/prisma/client";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { OrganizationResponseDto } from "../organizations/dto/organization-response.dto";
import { recordAdminAuditLog } from "./admin-audit-log";
import type { CreateOrganizationDto } from "./dto/create-organization.dto";
import type { UpdateOrganizationDto } from "./dto/update-organization.dto";

@Injectable()
export class AdminOrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    input: CreateOrganizationDto,
    actorSubject: string,
  ): Promise<OrganizationResponseDto> {
    try {
      return await this.prisma.$transaction(async (transaction) => {
        const organization = await transaction.organization.create({
          data: { code: input.code, name: input.name },
        });
        await recordAdminAuditLog(transaction, {
          actorSubject,
          action: "CREATE",
          entityType: "ORGANIZATION",
          entityId: organization.id,
        });
        return OrganizationResponseDto.fromModel(organization);
      });
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

  async update(
    organizationId: string,
    input: UpdateOrganizationDto,
    actorSubject: string,
  ): Promise<OrganizationResponseDto> {
    if (Object.keys(input).length === 0) {
      throw new BadRequestException(
        "At least one organization field is required",
      );
    }

    try {
      return await this.prisma.$transaction(async (transaction) => {
        const organization = await transaction.organization.update({
          where: { id: organizationId },
          data: { code: input.code, name: input.name },
        });
        await recordAdminAuditLog(transaction, {
          actorSubject,
          action: "UPDATE",
          entityType: "ORGANIZATION",
          entityId: organization.id,
        });
        return OrganizationResponseDto.fromModel(organization);
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          throw new NotFoundException("Organization not found");
        }
        if (error.code === "P2002") {
          throw new ConflictException("Organization code already exists");
        }
      }
      throw error;
    }
  }
}
