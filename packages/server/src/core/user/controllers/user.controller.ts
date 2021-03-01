import { Controller, Get } from '@nestjs/common';
import { UserService } from '../services/user.service';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) {}

  @Get('/hello')
  sayHello(): string {
    return this.userService.sayHello();
  }
}
