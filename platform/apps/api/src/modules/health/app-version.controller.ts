import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiOperation, ApiTags } from "@nestjs/swagger";
import { AppVersionResponseDto } from "./dto/app-version-response.dto";

@ApiTags("app")
@Controller("app")
export class AppVersionController {
  @Get("version")
  @ApiOperation({ summary: "Get latest application version and update info" })
  @ApiOkResponse({ type: AppVersionResponseDto })
  getAppVersion(): AppVersionResponseDto {
    return {
      version: "0.1.0",
      versionCode: 1,
      minSupportedVersion: "0.1.0",
      downloadUrl: "https://github.com/luscanascimento/notifica-fight/releases",
      releaseNotes: "Versão com integração da API-Sports e cards do UFC.",
    };
  }
}
