import { Controller, Get, Query } from '@nestjs/common';
import { AuthService } from '../services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Get('/google')
  authenticateWithGoogle(@Query() query: any): string {
    return this.authService.sayHello();
  }
}
