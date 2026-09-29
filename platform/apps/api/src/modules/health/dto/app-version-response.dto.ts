import { ApiProperty } from "@nestjs/swagger";

export class AppVersionResponseDto {
  @ApiProperty({ example: "0.1.0" })
  version!: string;

  @ApiProperty({ example: 1 })
  versionCode!: number;

  @ApiProperty({ example: "0.1.0" })
  minSupportedVersion!: string;

  @ApiProperty({ example: "https://github.com/luscanascimento/notifica-fight/releases" })
  downloadUrl!: string;

  @ApiProperty({ example: "Suporte inicial a eventos do UFC via API-Sports." })
  releaseNotes!: string;
}
