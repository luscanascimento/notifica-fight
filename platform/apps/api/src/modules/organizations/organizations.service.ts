import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../infrastructure/database/prisma.service";
import { OrganizationResponseDto } from "./dto/organization-response.dto";

@Injectable()
export class OrganizationsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<OrganizationResponseDto[]> {
    const organizations = await this.prisma.organization.findMany({
      orderBy: { name: "asc" },
    });
    return organizations.map((organization) =>
      OrganizationResponseDto.fromModel(organization),
    );
  }
}
