import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { encryptPassword } from 'src/utils/helper';
import { Repository } from 'typeorm';
import { Users } from '../../../entities/users.entity';
import * as JWT from "jsonwebtoken";
import { UserWithToken } from '../interfaces/userWithToken';
import { Request, Response } from "express";
import {AUTH_CONFIG_JWT_SECRET, AUTH_CONFIG_JWT_EXPIRY_TIME} from '../../../constants';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
  ) {}

  async authenticateWithEmail(email: string, password: string) : Promise<UserWithToken> {
    const encryptedPassword = encryptPassword(password);
    const user = await this.usersRepository.findOne({email: email, password: encryptedPassword});
    if(!user) {
      throw new NotFoundException("No user found with this email and password");
    }
    return {...user, token: this.getUserToken(user)};
  }

  async setUserAuthorizationCookies(token: string, request: Request, response: Response) {
    response.cookie("token", token, {httpOnly: true, domain: request.hostname});
    response.cookie("isLoggedIn", true, {domain: request.hostname});
  }

  parseUserToken(token: string): any {
    return JWT.verify(token, AUTH_CONFIG_JWT_SECRET);
  }

  private getUserToken(user: Users): string {
    return JWT.sign({user_id: user.id, team_id: user.teamId}, AUTH_CONFIG_JWT_SECRET, {expiresIn: AUTH_CONFIG_JWT_EXPIRY_TIME});
  }
}
