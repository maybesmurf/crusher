import { Users } from "src/entities/users.entity";
import { ApiProperty } from '@nestjs/swagger';

class UserWithToken extends Users {
  @ApiProperty()
  token: string;
};

export { UserWithToken };