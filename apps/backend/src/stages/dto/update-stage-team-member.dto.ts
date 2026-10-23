import { PartialType } from '@nestjs/mapped-types';
import { CreateStageTeamMemberDto } from './create-stage-team-member.dto';

export class UpdateStageTeamMemberDto extends PartialType(CreateStageTeamMemberDto) {}
