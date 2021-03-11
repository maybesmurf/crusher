import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { LoginWithEmailDTO } from '../interfaces/loginWithEmailDTO';
import { UserWithToken } from '../interfaces/userWithToken';
import { ApiDefaultResponse, ApiTags } from '@nestjs/swagger';
import {Request, Response} from "express";

@ApiTags("user")
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/login')
  @ApiDefaultResponse({
    type: UserWithToken
  })
  async loginUser(@Body() info: LoginWithEmailDTO, @Req() request: Request, @Res({passthrough: true}) response: Response) : Promise<UserWithToken> {
    const { email, password } = info;
    const userWithTokenRes = await this.authService.authenticateWithEmail(email, password);
    await this.authService.setUserAuthorizationCookies(userWithTokenRes.token, request, response);
    return userWithTokenRes;
  }
}
