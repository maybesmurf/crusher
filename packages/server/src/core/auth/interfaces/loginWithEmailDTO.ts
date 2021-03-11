import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginWithEmailDTO {
  @ApiProperty()
  @IsString()
  readonly email: string;

  @ApiProperty()
  @IsString()
  readonly password: string;
}