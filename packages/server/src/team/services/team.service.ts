import { Injectable } from '@nestjs/common';
import { Teams } from '../../entities/teams.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

@Injectable()
export class TeamService {
  constructor(
    @InjectRepository(Teams)
    private teamRepository: Repository<Teams>,
  ) {}

  sayHello(): any {
    return this.teamRepository.find();
  }
}
