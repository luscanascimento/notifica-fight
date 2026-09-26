import { PartialType } from "@nestjs/swagger";
import { CreateFightDto } from "./create-fight.dto";

export class UpdateFightDto extends PartialType(CreateFightDto) {}
