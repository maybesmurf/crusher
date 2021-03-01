import { Controller, Get } from '@nestjs/common';
import { TeamService } from '../services/team.service';

@Controller('teams')
export class TeamController {
  constructor(private teamService: TeamService) {}

  @Get('/hello')
  sayHello(): any {
    return this.teamService.sayHello();
  }
}
