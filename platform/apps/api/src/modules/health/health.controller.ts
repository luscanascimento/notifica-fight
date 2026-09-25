import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiProperty, ApiTags } from "@nestjs/swagger";

class HealthResponseDto {
  @ApiProperty({ example: "ok" })
  status!: "ok";
}

@ApiTags("health")
@Controller("health")
export class HealthController {
  @Get()
  @ApiOkResponse({ type: HealthResponseDto })
  getHealth(): HealthResponseDto {
    return { status: "ok" };
  }
}
