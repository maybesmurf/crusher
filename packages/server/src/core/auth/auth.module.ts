import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { UserModule } from '../user/user.module';
import { TeamModule } from '../team/team.module';

@Module({
  imports: [UserModule, TeamModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
