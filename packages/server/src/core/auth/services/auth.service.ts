import { Injectable, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { encryptPassword } from 'src/utils/helper';
import { Repository } from 'typeorm';
import { Users } from '../../../entities/users.entity';
import * as JWT from "jsonwebtoken";
import { UserWithToken } from '../interfaces/userWithToken';
import { Request, Response } from "express";
import {AUTH_CONFIG_JWT_SECRET, AUTH_CONFIG_JWT_EXPIRY_TIME} from '../../../constants';
import { Teams } from '../../../entities/teams.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Users)
    private usersRepository: Repository<Users>,
    @InjectRepository(Teams)
    private teamRepository: Repository<Teams>,
  ) {}

  async authenticateWithEmail(email: string, password: string) : Promise<UserWithToken> {
    const encryptedPassword = encryptPassword(password);
    const user = await this.usersRepository.findOne({email: email, password: encryptedPassword});
    if(!user) {
      throw new NotFoundException("No user found with this email and password");
    }
    return {...user, token: this.getUserToken(user)};
  }

  async registerUser(name: string, email: string, password: string): Promise<UserWithToken> {
    const existingUser = await this.usersRepository.findOne({email: email});
    if(existingUser) throw new NotAcceptableException("User with this email already exists");
    const encryptedPassword = encryptPassword(password);


    const team = await this.teamRepository.save({
      name: name,
      teamEmail: email,
      tier: 'FREE',
      stripeCustomerId: "2"
    });

    const user = await this.usersRepository.save({
      teamId: team.id,
      firstName: name,
      lastName: "",
      password: encryptedPassword,
      email: email
    });

    return {...user, token: await this.getUserToken(user)}
  }

  async setUserAuthorizationCookies(token: string, request: Request, response: Response) {
    response.cookie("token", token, {httpOnly: true, domain: request.hostname});
    response.cookie("isLoggedIn", true, {domain: request.hostname});
  }

  private getUserToken(user: Users): string {
    return JWT.sign({user_id: user.id, team_id: user.teamId}, AUTH_CONFIG_JWT_SECRET, {expiresIn: AUTH_CONFIG_JWT_EXPIRY_TIME});
  }
}
