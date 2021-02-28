import { Module } from '@nestjs/common';
import { UserModule } from './user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teams } from './entities/teams.entity';
import { TeamModule } from './team/team.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'remote',
      password: 'password',
      database: 'crusher',
      entities: [Teams],
    }),
    UserModule,
    TeamModule,
  ],
})
export class AppModule {}
