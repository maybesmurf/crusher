import { Injectable } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { Users } from '../../../entities/users.entity';

@Injectable()
export class UserService {
  constructor(
    // @InjectRepository(Users)
    // private usersRepository: Repository<Users>,
  ) {}

  sayHello(): string {
    return 'Hello World!';
  }
}
