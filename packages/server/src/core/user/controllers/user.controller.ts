import { Controller, Get } from '@nestjs/common';
import { UserService } from '../services/user.service';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("user")
@Controller('user')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/info')
  getUserInfo(): string {
    return this.userService.sayHello();
  }
}
