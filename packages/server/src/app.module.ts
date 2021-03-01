import { Module } from '@nestjs/common';
import { UserModule } from './core/user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Teams } from './entities/teams.entity';
import { TeamModule } from './core/team/team.module';
import { Users } from './entities/users.entity';
import { AuthModule } from './core/auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'remote',
      password: 'password',
      database: 'crusher',
      entities: [Teams, Users],
    }),
    UserModule,
    AuthModule,
    TeamModule,
  ],
})
export class AppModule {}
