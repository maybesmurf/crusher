import { Module } from '@nestjs/common';
import { TeamController } from './controllers/team.controller';
import { TeamService } from './services/team.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teams } from '../../entities/teams.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Teams])],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TypeOrmModule],
})
export class TeamModule {}
